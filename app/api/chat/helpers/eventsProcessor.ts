import { JsonRpcProvider, Interface, TransactionReceipt } from 'ethers';
import { TRANSFERS } from '../types';
import { TokensMetadataManager } from './tokensMetadataManager';

export interface ExtractedEvents {
  types: string[];
  transfers: TRANSFERS[];
  actions: any[];
  contractInteractions: string[];
  otherEvents: any[];
}

// Standard ERC-20 Transfer event signature
const ERC20_TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
// Standard ERC-721 Transfer event signature (same as ERC-20)
const ERC721_TRANSFER_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
// Standard ERC-1155 TransferSingle event signature
const ERC1155_TRANSFER_SINGLE_SIGNATURE = '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62';
// Standard ERC-1155 TransferBatch event signature
const ERC1155_TRANSFER_BATCH_SIGNATURE = '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb';

// ERC-20 ABI for parsing
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

// ERC-721 ABI for parsing
const ERC721_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

// ERC-1155 ABI for parsing
const ERC1155_ABI = [
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)'
];

export async function classifyAndExtractEvents(
  receipt: TransactionReceipt,
  provider: JsonRpcProvider
): Promise<ExtractedEvents> {
  const result: ExtractedEvents = {
    types: [],
    transfers: [],
    actions: [],
    contractInteractions: [],
    otherEvents: []
  };

  if (!receipt.logs || receipt.logs.length === 0) {
    return result;
  }

  const tokenMetadataManager = TokensMetadataManager.getInstance();

  for (const log of receipt.logs) {
    try {
      const contractAddress = log.address;
      result.contractInteractions.push(contractAddress);

      // Check for ERC-20 Transfer events
      if (log.topics[0] === ERC20_TRANSFER_SIGNATURE && log.topics.length === 3) {
        try {
          const erc20Interface = new Interface(ERC20_ABI);
          const parsedLog = erc20Interface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog) {
            const from = parsedLog.args.from;
            const to = parsedLog.args.to;
            const value = parsedLog.args.value.toString();

            // Get token metadata
            const tokenInfo = await tokenMetadataManager.getTokenInfo(contractAddress, provider);

            result.transfers.push({
              from,
              to,
              value,
              token: {
                address: contractAddress,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                decimals: tokenInfo.decimals
              }
            });

            result.types.push('ERC-20 Transfer');
            result.actions.push({
              type: 'ERC-20 Transfer',
              from,
              to,
              value,
              token: tokenInfo
            });
          }
        } catch (error) {
          console.error('Error parsing ERC-20 transfer:', error);
        }
      }

      // Check for ERC-721 Transfer events
      else if (log.topics[0] === ERC721_TRANSFER_SIGNATURE && log.topics.length === 4) {
        try {
          const erc721Interface = new Interface(ERC721_ABI);
          const parsedLog = erc721Interface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog) {
            const from = parsedLog.args.from;
            const to = parsedLog.args.to;
            const tokenId = parsedLog.args.tokenId.toString();

            // Get token metadata
            const tokenInfo = await tokenMetadataManager.getTokenInfo(contractAddress, provider);

            result.transfers.push({
              from,
              to,
              value: '1', // NFTs have value of 1
              tokenId,
              token: {
                address: contractAddress,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                decimals: 0 // NFTs don't have decimals
              }
            });

            result.types.push('ERC-721 Transfer');
            result.actions.push({
              type: 'ERC-721 Transfer',
              from,
              to,
              tokenId,
              token: tokenInfo
            });
          }
        } catch (error) {
          console.error('Error parsing ERC-721 transfer:', error);
        }
      }

      // Check for ERC-1155 TransferSingle events
      else if (log.topics[0] === ERC1155_TRANSFER_SINGLE_SIGNATURE) {
        try {
          const erc1155Interface = new Interface(ERC1155_ABI);
          const parsedLog = erc1155Interface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog) {
            const operator = parsedLog.args.operator;
            const from = parsedLog.args.from;
            const to = parsedLog.args.to;
            const id = parsedLog.args.id.toString();
            const value = parsedLog.args.value.toString();

            // Get token metadata
            const tokenInfo = await tokenMetadataManager.getTokenInfo(contractAddress, provider);

            result.transfers.push({
              from,
              to,
              value,
              tokenId: id,
              token: {
                address: contractAddress,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                decimals: 0 // ERC-1155 tokens don't have standard decimals
              }
            });

            result.types.push('ERC-1155 Transfer');
            result.actions.push({
              type: 'ERC-1155 TransferSingle',
              operator,
              from,
              to,
              id,
              value,
              token: tokenInfo
            });
          }
        } catch (error) {
          console.error('Error parsing ERC-1155 transfer:', error);
        }
      }

      // Check for ERC-1155 TransferBatch events
      else if (log.topics[0] === ERC1155_TRANSFER_BATCH_SIGNATURE) {
        try {
          const erc1155Interface = new Interface(ERC1155_ABI);
          const parsedLog = erc1155Interface.parseLog({
            topics: log.topics,
            data: log.data
          });

          if (parsedLog) {
            const operator = parsedLog.args.operator;
            const from = parsedLog.args.from;
            const to = parsedLog.args.to;
            const ids = parsedLog.args.ids.map((id: any) => id.toString());
            const values = parsedLog.args.values.map((value: any) => value.toString());

            // Get token metadata
            const tokenInfo = await tokenMetadataManager.getTokenInfo(contractAddress, provider);

            // Create transfers for each token in the batch
            for (let i = 0; i < ids.length; i++) {
              result.transfers.push({
                from,
                to,
                value: values[i],
                tokenId: ids[i],
                token: {
                  address: contractAddress,
                  symbol: tokenInfo.symbol,
                  name: tokenInfo.name,
                  decimals: 0
                }
              });
            }

            result.types.push('ERC-1155 Batch Transfer');
            result.actions.push({
              type: 'ERC-1155 TransferBatch',
              operator,
              from,
              to,
              ids,
              values,
              token: tokenInfo
            });
          }
        } catch (error) {
          console.error('Error parsing ERC-1155 batch transfer:', error);
        }
      }

      // Handle other events as generic
      else {
        result.otherEvents.push({
          address: contractAddress,
          topics: log.topics,
          data: log.data,
          logIndex: log.index
        });
      }

    } catch (error) {
      console.error('Error processing log:', error);
      result.otherEvents.push({
        address: log.address,
        topics: log.topics,
        data: log.data,
        logIndex: log.index,
        error: (error as Error).message
      });
    }
  }

  // Remove duplicates from types and contractInteractions
  result.types = [...new Set(result.types)];
  result.contractInteractions = [...new Set(result.contractInteractions)];

  return result;
}

// Helper function to identify token standard
export async function identifyTokenStandard(
  contractAddress: string,
  provider: JsonRpcProvider
): Promise<'ERC-20' | 'ERC-721' | 'ERC-1155' | 'Unknown'> {
  try {
    // Try ERC-20 first
    try {
      const erc20Contract = new Interface(ERC20_ABI);
      // If we can call these functions, it's likely ERC-20
      const code = await provider.getCode(contractAddress);
      if (code !== '0x') {
        return 'ERC-20';
      }
    } catch {}

    // Try ERC-721
    try {
      const erc721Contract = new Interface(ERC721_ABI);
      const code = await provider.getCode(contractAddress);
      if (code !== '0x') {
        return 'ERC-721';
      }
    } catch {}

    // Try ERC-1155
    try {
      const erc1155Contract = new Interface(ERC1155_ABI);
      const code = await provider.getCode(contractAddress);
      if (code !== '0x') {
        return 'ERC-1155';
      }
    } catch {}

    return 'Unknown';
  } catch (error) {
    console.error('Error identifying token standard:', error);
    return 'Unknown';
  }
}