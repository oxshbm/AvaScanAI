import { JsonRpcProvider } from 'ethers';

export interface Chain {
  name: string;
  chainId: number;
  shortName?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpc: string[];
  explorer: string;
}

// Chain data management for Avalanche
export class ChainManager {
  private static instance: ChainManager;
  private chains: Chain[] = [
    {
      name: 'Avalanche C-Chain',
      chainId: 43114,
      shortName: 'avalanche',
      nativeCurrency: {
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18
      },
      rpc: [
        'https://api.avax.network/ext/bc/C/rpc',
        'https://avalanche-c-chain.publicnode.com',
        'https://rpc.ankr.com/avalanche'
      ],
      explorer: 'https://snowtrace.io'
    },
    {
      name: 'Avalanche Fuji Testnet',
      chainId: 43113,
      shortName: 'avalanche-testnet',
      nativeCurrency: {
        name: 'Avalanche',
        symbol: 'AVAX',
        decimals: 18
      },
      rpc: [
        'https://api.avax-test.network/ext/bc/C/rpc',
        'https://avalanche-fuji-c-chain.publicnode.com'
      ],
      explorer: 'https://testnet.snowtrace.io'
    }
  ];

  private constructor() {}

  static getInstance(): ChainManager {
    if (!ChainManager.instance) {
      ChainManager.instance = new ChainManager();
    }
    return ChainManager.instance;
  }

  async getChain(chainId: number | string): Promise<Chain | undefined> {
    const numericChainId = typeof chainId === 'string' ? parseInt(chainId) : chainId;
    return this.chains.find(chain => chain.chainId === numericChainId);
  }

  async getProvider(chainId: number | string): Promise<JsonRpcProvider> {
    const chain = await this.getChain(chainId);
    if (!chain) throw new Error(`Chain ${chainId} not found`);
    if (!chain.rpc || chain.rpc.length === 0) throw new Error(`No RPC endpoints found for chain ${chainId}`);

    const errors: Error[] = [];
    for (const rpc of chain.rpc) {
      try {
        console.log(`Trying RPC: ${rpc}`);
        const provider = new JsonRpcProvider(rpc);
        
        // Test the connection with a simple call
        const network = await provider.getNetwork();
        console.log(`Successfully connected to RPC: ${rpc}, Chain ID: ${network.chainId}`);
        return provider;
      } catch (error) {
        console.warn(`RPC ${rpc} failed:`, error);
        errors.push(error as Error);
        continue;
      }
    }
    throw new Error(`All RPCs failed for chain ${chainId}. Errors: ${errors.map(e => e.message).join(', ')}`);
  }

  getAllChains(): Chain[] {
    return this.chains;
  }
}