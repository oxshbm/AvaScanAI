import { JsonRpcProvider } from 'ethers';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { systemPrompt } from './systemPrompt';
import { serializeBigInts } from './helpers';
import { ChainManager } from './helpers/chainManager';
import { TRANSFERS } from './types';
import { classifyAndExtractEvents } from './helpers/eventsProcessor';
import { PriceIntelligenceService } from './helpers/priceIntelligenceService';
import { DeFiProtocolDetector } from './helpers/defiProtocolDetector';
import { createSimpleMermaidDiagram, createTransferFlowDiagram } from './helpers/mermaidValidator';
import { validateAndDetectInput } from '../../utils/inputValidator';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
  "Access-Control-Max-Age": "86400",
};

// Enhanced block analysis for Avalanche
async function analyzeBlock(blockNumber: string, chainId: number) {
  console.log(`Analyzing block: ${blockNumber} on chainId: ${chainId}`);
  const chainManager = ChainManager.getInstance();
  const priceIntelligence = PriceIntelligenceService.getInstance();

  try {
    const [provider, chain] = await Promise.all([
      chainManager.getProvider(chainId),
      chainManager.getChain(chainId)
    ]);

    if (!chain) throw new Error(`Chain ${chainId} not found`);

    // Parse block number
    const blockNum = parseInt(blockNumber);
    if (isNaN(blockNum)) throw new Error('Invalid block number');

    // Get block with transactions
    const block = await provider.getBlock(blockNum, true);
    if (!block) throw new Error('Block not found');

    // Get additional block data
    const latestBlock = await provider.getBlockNumber();
    const previousBlock = blockNum > 0 ? await provider.getBlock(blockNum - 1, false) : null;
    
    // Calculate block metrics
    const gasUtilization = Number(block.gasUsed) / Number(block.gasLimit) * 100;
    const blockTime = previousBlock ? block.timestamp - previousBlock.timestamp : 0;
    
    // Analyze transactions in the block
    const transactionAnalysis = {
      totalTransactions: block.transactions.length,
      totalGasUsed: block.gasUsed.toString(),
      averageGasPerTx: block.transactions.length > 0 ? 
        (Number(block.gasUsed) / block.transactions.length).toString() : '0',
      transactionTypes: {} as Record<string, number>,
      totalValue: '0',
      uniqueAddresses: new Set<string>()
    };

    // Process first 10 transactions for detailed analysis
    const detailedTransactions = [];
    for (let i = 0; i < Math.min(10, block.transactions.length); i++) {
      try {
        const txHash = typeof block.transactions[i] === 'string' ? 
          block.transactions[i] : (block.transactions[i] as any).hash;
        
        const tx = await provider.getTransaction(txHash);
        if (tx) {
          // Track transaction types
          const txType = tx.to ? 'Call' : 'Create';
          transactionAnalysis.transactionTypes[txType] = 
            (transactionAnalysis.transactionTypes[txType] || 0) + 1;
          
          // Track addresses
          transactionAnalysis.uniqueAddresses.add(tx.from);
          if (tx.to) transactionAnalysis.uniqueAddresses.add(tx.to);
          
          // Add to total value
          transactionAnalysis.totalValue = 
            (BigInt(transactionAnalysis.totalValue) + tx.value).toString();
          
          detailedTransactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            gasLimit: tx.gasLimit.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            type: txType
          });
        }
      } catch (error) {
        console.error(`Error analyzing transaction ${i}:`, error);
      }
    }

    // Generate block analysis
    const blockAnalysis = {
      network: {
        name: chain.name,
        chainId: chain.chainId,
        currency: chain.nativeCurrency.symbol,
        latestBlock: latestBlock,
        blockAge: latestBlock - blockNum
      },
      block: {
        number: block.number,
        hash: block.hash,
        parentHash: block.parentHash,
        timestamp: block.timestamp,
        timestampISO: new Date(block.timestamp * 1000).toISOString(),
        gasLimit: block.gasLimit.toString(),
        gasUsed: block.gasUsed.toString(),
        gasUtilization: `${gasUtilization.toFixed(2)}%`,
        blockTime: `${blockTime}s`,
        miner: block.miner,
        difficulty: block.difficulty?.toString() || '0',
        extraData: block.extraData
      },
      transactions: {
        ...transactionAnalysis,
        uniqueAddresses: transactionAnalysis.uniqueAddresses.size,
        detailedTransactions: detailedTransactions,
        allTransactionHashes: block.transactions.slice(0, 50).map(tx => 
          typeof tx === 'string' ? tx : (tx as any).hash
        )
      },
      summary: {
        totalTransactions: block.transactions.length,
        gasEfficiency: `${gasUtilization.toFixed(1)}%`,
        networkActivity: gasUtilization > 80 ? 'High' : gasUtilization > 50 ? 'Medium' : 'Low',
        blockHealth: block.transactions.length > 0 ? 'Active' : 'Empty',
        timeFromLatest: `${latestBlock - blockNum} blocks behind`
      },
      mermaidDiagram: `graph TB
    B["Block #${block.number}"] --> |"${block.transactions.length} txns"| T["Transactions"]
    B --> |"${gasUtilization.toFixed(1)}% gas used"| G["Gas: ${block.gasUsed}"]
    B --> |"Mined by"| M["${block.miner}"]
    T --> |"${transactionAnalysis.uniqueAddresses} addresses"| A["Unique Addresses"]
    
    classDef blockStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef txStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef gasStyle fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    
    class B blockStyle
    class T,A txStyle
    class G,M gasStyle`
    };

    return blockAnalysis;
  } catch (error) {
    console.error('Block analysis error:', error);
    throw error;
  }
}

// Enhanced address analysis for Avalanche
async function analyzeAddress(address: string, chainId: number) {
  console.log(`Analyzing address: ${address} on chainId: ${chainId}`);
  const chainManager = ChainManager.getInstance();
  const priceIntelligence = PriceIntelligenceService.getInstance();

  try {
    const [provider, chain] = await Promise.all([
      chainManager.getProvider(chainId),
      chainManager.getChain(chainId)
    ]);

    if (!chain) throw new Error(`Chain ${chainId} not found`);

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error('Invalid address format');
    }

    // Get basic address information
    const [balance, code, transactionCount, latestBlock] = await Promise.all([
      provider.getBalance(address),
      provider.getCode(address),
      provider.getTransactionCount(address),
      provider.getBlockNumber()
    ]);

    const isContract = code !== '0x';
    const balanceInAVAX = Number(balance) / 1e18;

    // Get recent transactions (simplified - in production would use indexing service)
    const recentTransactions = [];
    
    // For contracts, analyze the code
    let contractAnalysis = null;
    if (isContract) {
      contractAnalysis = {
        codeSize: code.length,
        isLikelyProxy: code.includes('delegatecall') || code.includes('proxy'),
        isLikelyToken: code.includes('transfer') && code.includes('balanceOf'),
        isLikelyMultisig: code.includes('confirmTransaction') || code.includes('owners'),
        estimatedComplexity: code.length > 10000 ? 'High' : code.length > 2000 ? 'Medium' : 'Low'
      };
    }

    // Analyze address activity
    const addressAnalysis = {
      network: {
        name: chain.name,
        chainId: chain.chainId,
        currency: chain.nativeCurrency.symbol,
        latestBlock: latestBlock
      },
      address: {
        address: address,
        balance: balance.toString(),
        balanceAVAX: balanceInAVAX,
        transactionCount: transactionCount,
        isContract: isContract,
        codeSize: code.length
      },
      analysis: {
        addressType: isContract ? 'Contract' : 'EOA',
        activityLevel: transactionCount > 100 ? 'High' : transactionCount > 10 ? 'Medium' : 'Low',
        balanceCategory: balanceInAVAX > 1000 ? 'Whale' : balanceInAVAX > 100 ? 'Large' : 
                        balanceInAVAX > 1 ? 'Medium' : 'Small',
        riskLevel: isContract && !contractAnalysis?.isLikelyToken ? 'Medium' : 'Low'
      },
      contract: contractAnalysis,
      recentActivity: {
        transactions: recentTransactions,
        lastActivity: 'Unknown' // Would need indexing service for this
      },
      summary: {
        totalBalance: balanceInAVAX,
        totalTransactions: transactionCount,
        accountAge: 'Unknown', // Would need first transaction analysis
        estimatedValue: balanceInAVAX, // Could enhance with token balances
        interactionComplexity: isContract ? 'High' : 'Simple'
      },
      mermaidDiagram: `graph TB
    A["Address"] --> |"${balanceInAVAX.toFixed(4)} AVAX"| B["Balance"]
    A --> |"${transactionCount} txns"| T["Activity"]
    A --> |"${isContract ? 'Contract' : 'EOA'}"| TYPE["Type"]
    
    ${isContract ? `
    TYPE --> |"Code: ${code.length} bytes"| C["Contract Details"]
    C --> |"${contractAnalysis?.estimatedComplexity} complexity"| COMP["Analysis"]
    ` : ''}
    
    classDef addressStyle fill:#e3f2fd,stroke:#0277bd,stroke-width:2px
    classDef balanceStyle fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef contractStyle fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class A addressStyle
    class B,T balanceStyle
    class TYPE,C,COMP contractStyle`
    };

    return addressAnalysis;
  } catch (error) {
    console.error('Address analysis error:', error);
    throw error;
  }
}

// Enhanced transaction analysis for Avalanche with advanced intelligence
async function analyzeTransaction(txHash: string, chainId: number) {
  console.log(`Analyzing transaction: ${txHash} on chainId: ${chainId}`);
  const chainManager = ChainManager.getInstance();
  const priceIntelligence = PriceIntelligenceService.getInstance();
  const defiDetector = DeFiProtocolDetector.getInstance();

  try {
    const [provider, chain] = await Promise.all([
      chainManager.getProvider(chainId), 
      chainManager.getChain(chainId)
    ]);
    
    if (!chain) throw new Error(`Chain ${chainId} not found`);

    // Get transaction and receipt
    const tx = await provider.getTransaction(txHash);
    if (!tx) throw new Error('Transaction not found');

    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) throw new Error('Transaction receipt not found');

    // Get block info
    const block = await provider.getBlock(tx.blockNumber!);

    // Calculate fee information
    const gasUsed = receipt.gasUsed;
    const gasPrice = tx.gasPrice || 0n;
    const actualFee = gasUsed * gasPrice;

    const baseAnalysis = {
      network: {
        name: chain.name,
        chainId: chain.chainId,
        currency: chain.nativeCurrency.symbol,
        blockNumber: tx.blockNumber,
        blockTimestamp: block?.timestamp ? new Date(block.timestamp * 1000).toISOString() : 'unknown'
      },
      transaction: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasLimit: tx.gasLimit.toString(),
        gasPrice: gasPrice.toString(),
        gasUsed: gasUsed.toString(),
        actualFee: actualFee.toString(),
        nonce: tx.nonce,
        type: tx.type,
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        data: tx.data
      },
      actionTypes: [] as string[],
      transfers: [] as TRANSFERS[],
      actions: [] as any[],
      interactions: [] as string[],
      securityInfo: [] as any[],
      otherEvents: [] as any[],
      summary: {} as any
    };

    // Process transaction type
    if (tx.to) {
      baseAnalysis.actionTypes.push('Contract Call');
      baseAnalysis.interactions.push(tx.to);
    } else {
      baseAnalysis.actionTypes.push('Contract Creation');
      baseAnalysis.securityInfo.push({
        type: 'Info',
        message: 'New contract deployment'
      });
    }

    // Process native AVAX transfer
    if (tx.value > 0n) {
      baseAnalysis.actionTypes.push('AVAX Transfer');
      baseAnalysis.transfers.push({
        from: tx.from,
        to: tx.to || 'Contract Creation',
        value: tx.value.toString(),
        token: {
          address: 'native',
          symbol: 'AVAX',
          name: 'Avalanche',
          decimals: 18
        }
      });
    }

    // Extract and classify events if available
    if (receipt.logs && receipt.logs.length > 0) {
      try {
        const extractedEvents = await classifyAndExtractEvents(receipt, provider);
        
        // Add events to analysis
        baseAnalysis.actionTypes = [...new Set([...baseAnalysis.actionTypes, ...extractedEvents.types])];
        baseAnalysis.transfers = [...baseAnalysis.transfers, ...extractedEvents.transfers];
        baseAnalysis.actions = [...baseAnalysis.actions, ...extractedEvents.actions];
        baseAnalysis.interactions = [...new Set([...baseAnalysis.interactions, ...extractedEvents.contractInteractions])];
        baseAnalysis.otherEvents = [...baseAnalysis.otherEvents, ...extractedEvents.otherEvents];
      } catch (error) {
        console.error('Error processing events:', error);
      }
    }

    // Add execution status info
    if (receipt.status === 1) {
      baseAnalysis.securityInfo.push({
        type: 'Success',
        message: 'Transaction executed successfully'
      });
    } else {
      baseAnalysis.securityInfo.push({
        type: 'Error',
        message: 'Transaction failed'
      });
    }

    // ENHANCED INTELLIGENCE PROCESSING
    console.log('Starting advanced intelligence analysis...');

    // 1. Advanced Price Intelligence Analysis
    const advancedAnalysis = await priceIntelligence.getAdvancedAnalysis(
      baseAnalysis.transfers,
      {
        gasUsed: gasUsed.toString(),
        gasPrice: gasPrice.toString(),
        gasLimit: tx.gasLimit.toString(),
        actualFee: actualFee.toString()
      },
      baseAnalysis.interactions,
      provider
    );

    // 2. DeFi Protocol Detection and Analysis
    const defiInteractions = await defiDetector.detectDeFiInteractions(
      baseAnalysis.interactions,
      tx,
      receipt.logs || [],
      provider
    );

    // 3. Enhanced Risk Assessment
    const enhancedSecurityInfo = await generateEnhancedSecurityAnalysis(
      baseAnalysis,
      advancedAnalysis,
      defiInteractions,
      provider
    );

    // 4. Market Intelligence
    const marketIntelligence = await generateMarketIntelligence(
      baseAnalysis.transfers,
      advancedAnalysis,
      defiInteractions
    );

    // Calculate enhanced metrics
    const gasEfficiency = calculateGasEfficiency(gasUsed, tx.gasLimit);
    const complexityScore = calculateEnhancedComplexityScore(baseAnalysis, defiInteractions, advancedAnalysis);
    const riskLevel = calculateEnhancedRiskLevel(baseAnalysis, advancedAnalysis, defiInteractions);

    // Generate Mermaid diagram
    const mermaidDiagram = createTransferFlowDiagram(
      baseAnalysis.transfers,
      advancedAnalysis.usdValue
    );

    // Combine all analysis into comprehensive result
    const enhancedAnalysis = {
      ...baseAnalysis,
      
      // Enhanced Intelligence Data
      priceIntelligence: advancedAnalysis,
      defiAnalysis: defiInteractions,
      securityAssessment: enhancedSecurityInfo,
      marketIntelligence: marketIntelligence,
      mermaidDiagram: mermaidDiagram,
      
      // Enhanced Summary
      summary: {
        totalTransfers: baseAnalysis.transfers.length,
        uniqueTokens: new Set(baseAnalysis.transfers.map(t => t.token?.address || '')).size,
        uniqueContracts: baseAnalysis.interactions.length,
        totalEvents: receipt.logs?.length || 0,
        
        // Enhanced metrics
        complexityScore: complexityScore,
        riskLevel: riskLevel,
        gasEfficiency: gasEfficiency,
        
        // USD Values
        totalUSDValue: advancedAnalysis.usdValue.total,
        feeUSD: advancedAnalysis.usdValue.fees,
        
        // DeFi insights
        defiProtocolsDetected: defiInteractions.length,
        arbitrageOpportunities: advancedAnalysis.marketImpact.arbitrageOpportunities.length,
        
        // Risk insights
        overallRiskAssessment: advancedAnalysis.riskAssessment.overall,
        securityScore: calculateSecurityScore(enhancedSecurityInfo),
        
        // Performance insights
        gasOptimizationPotential: advancedAnalysis.gasAnalysis.recommendations.costSaving,
        networkCongestion: advancedAnalysis.gasAnalysis.networkCongestion,
        
        // Market insights
        priceImpact: advancedAnalysis.marketImpact.priceMovement,
        volumeSignificance: advancedAnalysis.marketImpact.volumeSignificance,
        
        totalAVAXValue: baseAnalysis.transfers
          .filter(t => t.token?.symbol === 'AVAX')
          .reduce((sum, t) => sum + parseFloat(t.value || '0'), 0)
      }
    };

    console.log('Advanced intelligence analysis completed');
    return enhancedAnalysis;
  } catch (error) {
    console.error('Enhanced transaction analysis error:', error);
    throw error;
  }
}

// Helper functions
function calculateGasEfficiency(gasUsed: bigint, gasLimit: bigint): string {
  const efficiency = Number(gasUsed) / Number(gasLimit) * 100;
  return `${efficiency.toFixed(1)}%`;
}

function calculateComplexityScore(analysis: any): string {
  let score = 0;
  score += analysis.transfers.length * 2;
  score += analysis.interactions.length * 3;
  score += analysis.securityInfo.length * 2;
  score += analysis.actionTypes.length > 1 ? 5 : 0;
  score += analysis.summary.totalEvents > 10 ? 10 : analysis.summary.totalEvents;
  
  if (score <= 5) return 'Simple';
  if (score <= 15) return 'Moderate';
  if (score <= 30) return 'Complex';
  return 'Very Complex';
}

function calculateRiskLevel(analysis: any): string {
  let riskFactors = 0;
  if (analysis.interactions.length > 3) riskFactors++;
  if (analysis.actionTypes.includes('Contract Creation')) riskFactors++;
  if (analysis.securityInfo.some((e: any) => e.type === 'Error')) riskFactors += 2;
  if (analysis.transfers.length > 5) riskFactors++;
  if (analysis.actionTypes.length > 3) riskFactors++;
  if (analysis.transaction.status !== 'SUCCESS') riskFactors += 2;
  
  if (riskFactors === 0) return 'Low';
  if (riskFactors <= 2) return 'Medium';
  return 'High';
}

// Enhanced helper functions for advanced analysis
async function generateEnhancedSecurityAnalysis(
  baseAnalysis: any,
  advancedAnalysis: any,
  defiInteractions: any[],
  provider: any
): Promise<any> {
  const securityInfo = {
    contractVerification: await checkContractVerification(baseAnalysis.interactions, provider),
    suspiciousPatterns: detectSuspiciousPatterns(baseAnalysis, advancedAnalysis),
    riskFactors: assessRiskFactors(baseAnalysis, advancedAnalysis, defiInteractions),
    recommendations: generateSecurityRecommendations(baseAnalysis, advancedAnalysis, defiInteractions)
  };
  
  return securityInfo;
}

async function generateMarketIntelligence(
  transfers: any[],
  advancedAnalysis: any,
  defiInteractions: any[]
): Promise<any> {
  return {
    liquidityAnalysis: analyzeLiquidityDepth(transfers, advancedAnalysis),
    arbitrageOpportunities: advancedAnalysis.marketImpact.arbitrageOpportunities,
    marketTiming: analyzeMarketTiming(advancedAnalysis),
    crossProtocolAnalysis: analyzeCrossProtocolOpportunities(defiInteractions)
  };
}

function calculateEnhancedComplexityScore(
  baseAnalysis: any,
  defiInteractions: any[],
  advancedAnalysis: any
): string {
  let score = 0;
  
  // Base complexity
  score += baseAnalysis.transfers.length * 2;
  score += baseAnalysis.interactions.length * 3;
  score += baseAnalysis.actionTypes.length > 1 ? 5 : 0;
  
  // DeFi complexity
  score += defiInteractions.length * 5;
  score += defiInteractions.filter(d => d.protocol.type === 'DEX').length * 3;
  score += defiInteractions.filter(d => d.protocol.type === 'Lending').length * 4;
  
  // USD value complexity
  if (advancedAnalysis.usdValue.total > 100000) score += 10;
  else if (advancedAnalysis.usdValue.total > 10000) score += 5;
  
  // Risk complexity
  if (advancedAnalysis.riskAssessment.overall === 'High') score += 8;
  else if (advancedAnalysis.riskAssessment.overall === 'Medium') score += 4;
  
  if (score <= 10) return 'Simple';
  if (score <= 25) return 'Moderate';
  if (score <= 50) return 'Complex';
  return 'Very Complex';
}

function calculateEnhancedRiskLevel(
  baseAnalysis: any,
  advancedAnalysis: any,
  defiInteractions: any[]
): string {
  // Use the sophisticated risk assessment from price intelligence
  return advancedAnalysis.riskAssessment.overall;
}

function calculateSecurityScore(securityInfo: any): number {
  let score = 100; // Start with perfect score
  
  // Deduct points for risks
  if (securityInfo.riskFactors) {
    score -= securityInfo.riskFactors.length * 10;
  }
  
  if (securityInfo.suspiciousPatterns && securityInfo.suspiciousPatterns.length > 0) {
    score -= 20;
  }
  
  if (securityInfo.contractVerification && 
      securityInfo.contractVerification.unverified > 0) {
    score -= securityInfo.contractVerification.unverified * 15;
  }
  
  return Math.max(0, Math.min(100, score));
}

async function checkContractVerification(interactions: string[], provider: any): Promise<any> {
  const verificationResults = {
    total: interactions.length,
    verified: 0,
    unverified: 0,
    details: [] as any[]
  };
  
  for (const address of interactions) {
    try {
      const code = await provider.getCode(address);
      const isContract = code !== '0x';
      
      // In a real implementation, you would check against verification databases
      // For now, we'll use heuristics
      const isLikelyVerified = isContract && code.length > 1000; // Simple heuristic
      
      if (isLikelyVerified) {
        verificationResults.verified++;
      } else {
        verificationResults.unverified++;
      }
      
      verificationResults.details.push({
        address,
        isContract,
        verificationStatus: isLikelyVerified ? 'Likely Verified' : 'Unverified',
        codeSize: code.length
      });
    } catch (error) {
      verificationResults.unverified++;
      verificationResults.details.push({
        address,
        isContract: false,
        verificationStatus: 'Error',
        error: (error as Error).message
      });
    }
  }
  
  return verificationResults;
}

function detectSuspiciousPatterns(baseAnalysis: any, advancedAnalysis: any): string[] {
  const suspicious = [];
  
  // Check for unusual gas usage
  if (advancedAnalysis.gasAnalysis.networkCongestion === 'High' &&
      baseAnalysis.transaction.gasPrice > advancedAnalysis.gasAnalysis.averageGasPrice * 2n) {
    suspicious.push('Unusually high gas price during congestion');
  }
  
  // Check for large value movements
  if (advancedAnalysis.usdValue.total > 1000000) {
    suspicious.push('Large value transaction - potential whale activity');
  }
  
  // Check for failed transactions with high gas usage
  if (baseAnalysis.transaction.status === 'FAILED' && 
      Number(baseAnalysis.transaction.gasUsed) > Number(baseAnalysis.transaction.gasLimit) * 0.8) {
    suspicious.push('Failed transaction with high gas consumption');
  }
  
  // Check for multiple complex DeFi interactions
  if (advancedAnalysis.marketImpact.arbitrageOpportunities.length > 2) {
    suspicious.push('Multiple arbitrage opportunities detected - possible MEV activity');
  }
  
  return suspicious;
}

function assessRiskFactors(baseAnalysis: any, advancedAnalysis: any, defiInteractions: any[]): any[] {
  return advancedAnalysis.riskAssessment.factors;
}

function generateSecurityRecommendations(
  baseAnalysis: any,
  advancedAnalysis: any,
  defiInteractions: any[]
): string[] {
  const recommendations = [...advancedAnalysis.riskAssessment.recommendations];
  
  // Add transaction-specific recommendations
  if (baseAnalysis.transaction.status === 'FAILED') {
    recommendations.push('Investigate transaction failure cause before retrying');
  }
  
  if (defiInteractions.some(d => !d.protocol.verified)) {
    recommendations.push('Exercise caution with unverified DeFi protocols');
  }
  
  return recommendations;
}

function analyzeLiquidityDepth(transfers: any[], advancedAnalysis: any): any {
  return {
    totalLiquidity: advancedAnalysis.usdValue.total,
    marketDepth: advancedAnalysis.marketImpact.volumeSignificance,
    slippageRisk: transfers.length > 3 ? 'High' : 'Low'
  };
}

function analyzeMarketTiming(advancedAnalysis: any): any {
  return {
    networkCongestion: advancedAnalysis.gasAnalysis.networkCongestion,
    optimalTiming: advancedAnalysis.gasAnalysis.recommendations.timing,
    costOptimization: advancedAnalysis.gasAnalysis.recommendations.costSaving
  };
}

function analyzeCrossProtocolOpportunities(defiInteractions: any[]): any[] {
  const opportunities = [];
  
  // Look for cross-protocol arbitrage
  if (defiInteractions.length > 1) {
    opportunities.push({
      type: 'Cross-Protocol Arbitrage',
      protocols: defiInteractions.map(d => d.protocol.name),
      risk: 'Medium',
      potential: 'Variable'
    });
  }
  
  return opportunities;
}

// Create OpenAI instance
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// API Route handler
export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      tools: {
        analyzeAvalancheInput: tool({
          description: 'Perform comprehensive AI-powered analysis of Avalanche C-Chain transactions, blocks, or addresses with real-time data and intelligent detection',
          parameters: z.object({
            input: z.string().describe('The input to analyze - can be transaction hash, block number, or address'),
            chainId: z.number().default(43114).describe('The chain ID (defaults to Avalanche C-Chain mainnet)'),
          }),
          execute: async ({ input, chainId }) => {
            try {
              const actualChainId = chainId || 43114;
              
              // Validate and detect input type
              const validation = validateAndDetectInput(input);
              
              if (validation.type === 'invalid') {
                return {
                  success: false,
                  error: 'Invalid input format. Please provide a transaction hash (0x...), block number, or address.',
                };
              }
              
              let analysis;
              
              switch (validation.type) {
                case 'transaction':
                  analysis = await analyzeTransaction(validation.normalized || validation.value, actualChainId);
                  break;
                case 'block':
                  analysis = await analyzeBlock(validation.normalized || validation.value, actualChainId);
                  break;
                case 'address':
                  analysis = await analyzeAddress(validation.normalized || validation.value, actualChainId);
                  break;
                default:
                  throw new Error('Unsupported input type');
              }
              
              const serializedAnalysis = serializeBigInts({
                inputType: validation.type,
                inputValue: validation.value,
                normalizedInput: validation.normalized,
                analysisData: analysis
              });
              
              return {
                success: true,
                data: JSON.stringify(serializedAnalysis),
              };
            } catch (error) {
              console.error('Tool execution error:', error);
              return {
                success: false,
                error: (error as Error).message,
              };
            }
          },
        }),
      },
      temperature: 0.7,
      maxSteps: 5,
    });

    const response = result.toDataStreamResponse();
    const headersObject = Object.fromEntries(response.headers.entries());
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...headersObject,
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export const maxDuration = 30;

export async function OPTIONS(req: NextRequest) {
  return new Response(null, { status: 204, headers: corsHeaders });
}