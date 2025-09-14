import { JsonRpcProvider, Contract } from 'ethers';

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  type: 'ERC-20' | 'ERC-721' | 'ERC-1155' | 'Unknown';
}

// ERC-20 ABI for metadata
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

// ERC-721 ABI for metadata
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

// ERC-1155 ABI for metadata
const ERC1155_ABI = [
  'function uri(uint256) view returns (string)'
];

export class TokensMetadataManager {
  private static instance: TokensMetadataManager;
  private cache: Map<string, TokenInfo> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes
  
  private constructor() {}

  static getInstance(): TokensMetadataManager {
    if (!TokensMetadataManager.instance) {
      TokensMetadataManager.instance = new TokensMetadataManager();
    }
    return TokensMetadataManager.instance;
  }

  async getTokenInfo(tokenAddress: string, provider: JsonRpcProvider): Promise<TokenInfo> {
    // Check cache first
    const cacheKey = `${tokenAddress.toLowerCase()}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const tokenInfo = await this.fetchTokenMetadata(tokenAddress, provider);
      
      // Cache the result
      this.cache.set(cacheKey, tokenInfo);
      
      // Clean up cache after duration
      setTimeout(() => {
        this.cache.delete(cacheKey);
      }, this.CACHE_DURATION);
      
      return tokenInfo;
    } catch (error) {
      console.error('Error getting token info:', error);
      const fallbackInfo: TokenInfo = {
        address: tokenAddress,
        name: 'Unknown Token',
        symbol: 'UNKNOWN',
        decimals: 18,
        type: 'Unknown'
      };
      return fallbackInfo;
    }
  }

  private async fetchTokenMetadata(tokenAddress: string, provider: JsonRpcProvider): Promise<TokenInfo> {
    // Try ERC-20 first
    try {
      const erc20Contract = new Contract(tokenAddress, ERC20_ABI, provider);
      
      const [name, symbol, decimals] = await Promise.all([
        erc20Contract.name(),
        erc20Contract.symbol(),
        erc20Contract.decimals()
      ]);

      return {
        address: tokenAddress,
        name: name || 'Unknown Token',
        symbol: symbol || 'UNKNOWN',
        decimals: Number(decimals) || 18,
        type: 'ERC-20'
      };
    } catch (error) {
      console.log('Not an ERC-20 token, trying ERC-721...');
    }

    // Try ERC-721
    try {
      const erc721Contract = new Contract(tokenAddress, ERC721_ABI, provider);
      
      const [name, symbol] = await Promise.all([
        erc721Contract.name(),
        erc721Contract.symbol()
      ]);

      return {
        address: tokenAddress,
        name: name || 'Unknown NFT',
        symbol: symbol || 'NFT',
        decimals: 0, // NFTs don't have decimals
        type: 'ERC-721'
      };
    } catch (error) {
      console.log('Not an ERC-721 token, trying ERC-1155...');
    }

    // Try ERC-1155
    try {
      const erc1155Contract = new Contract(tokenAddress, ERC1155_ABI, provider);
      
      // ERC-1155 doesn't have standard name/symbol, so we'll use generic values
      await erc1155Contract.uri(1); // Test if it's ERC-1155
      
      return {
        address: tokenAddress,
        name: 'Multi-Token',
        symbol: 'ERC1155',
        decimals: 0,
        type: 'ERC-1155'
      };
    } catch (error) {
      console.log('Not an ERC-1155 token');
    }

    // If all fail, return unknown
    return {
      address: tokenAddress,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
      type: 'Unknown'
    };
  }

  // Helper method to determine if an address is likely a token contract
  async isTokenContract(address: string, provider: JsonRpcProvider): Promise<boolean> {
    try {
      const code = await provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }
}