import { JsonRpcProvider, Interface, Contract } from 'ethers';

export interface DeFiProtocol {
  name: string;
  type: 'DEX' | 'Lending' | 'Yield Farming' | 'Staking' | 'Bridge' | 'Derivatives' | 'Insurance' | 'Launchpad' | 'DAO' | 'Unknown';
  address: string;
  description: string;
  website?: string;
  documentation?: string;
  verified: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface DeFiInteraction {
  protocol: DeFiProtocol;
  actionType: string;
  confidence: number;
  details: {
    function?: string;
    parameters?: any;
    estimatedValue?: number;
    fees?: {
      protocol: number;
      gas: number;
      slippage: number;
    };
  };
  analysis: {
    purpose: string;
    riskFactors: string[];
    opportunities: string[];
    recommendations: string[];
  };
}

export interface DEXSwapAnalysis {
  tokenIn: {
    address: string;
    symbol: string;
    amount: string;
    valueUSD: number;
  };
  tokenOut: {
    address: string;
    symbol: string;
    amount: string;
    valueUSD: number;
  };
  slippage: number;
  priceImpact: number;
  effectivePrice: number;
  marketPrice: number;
  arbitrageOpportunity: boolean;
  routingPath: string[];
}

export interface LendingProtocolAnalysis {
  action: 'Supply' | 'Borrow' | 'Repay' | 'Withdraw' | 'Liquidation';
  asset: {
    address: string;
    symbol: string;
    amount: string;
    valueUSD: number;
  };
  healthFactor?: number;
  apr?: number;
  utilizationRate?: number;
  liquidationThreshold?: number;
  collateralValue?: number;
}

export interface YieldFarmingAnalysis {
  farmType: 'LP Token Staking' | 'Single Token' | 'Vault Strategy';
  poolInfo: {
    tokens: string[];
    totalValueLocked: number;
    apr: number;
    rewards: Array<{
      token: string;
      rate: number;
    }>;
  };
  userAction: 'Stake' | 'Unstake' | 'Claim Rewards';
  impermanentLossRisk: 'Low' | 'Medium' | 'High';
}

// Known DeFi protocols on Avalanche
const KNOWN_DEFI_PROTOCOLS: Record<string, DeFiProtocol> = {
  // DEX Protocols
  '0x1f98431c8ad98523631ae4a59f267346ea31f984': {
    name: 'Uniswap V3',
    type: 'DEX',
    address: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    description: 'Automated Market Maker with concentrated liquidity',
    website: 'https://uniswap.org',
    verified: true,
    riskLevel: 'Low'
  },
  // Add more protocols as they deploy to Avalanche
};

// Function signatures for common DeFi operations
const DEFI_FUNCTION_SIGNATURES = {
  // DEX Operations
  'swapExactTokensForTokens': '0x38ed1739',
  'swapTokensForExactTokens': '0x8803dbee',
  'swapExactETHForTokens': '0x7ff36ab5',
  'swapTokensForExactETH': '0x4a25d94a',
  'swapExactTokensForETH': '0x18cbafe5',
  'swapETHForExactTokens': '0xfb3bdb41',
  'exactInputSingle': '0x414bf389', // Uniswap V3
  'exactOutputSingle': '0xdb3e2198', // Uniswap V3
  
  // Lending Operations
  'supply': '0x617ba037', // Aave
  'borrow': '0xa415bcad',
  'repay': '0x573ade81',
  'withdraw': '0x69328dec',
  'liquidationCall': '0x00a718a9',
  
  // Yield Farming
  'stake': '0xa694fc3a',
  'unstake': '0x2e17de78',
  'harvest': '0x4641257d',
  'compound': '0xf69e2046',
  
  // Bridge Operations
  'depositETH': '0x439370b1',
  'withdrawETH': '0xc7cdea37',
  'bridge': '0x838b2520',
  
  // Governance
  'propose': '0xda95691a',
  'vote': '0x15373e3d',
  'execute': '0xfe0d94c1'
};

// Event signatures for DeFi protocols
const DEFI_EVENT_SIGNATURES = {
  // DEX Events
  'Swap': '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822',
  'Mint': '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f',
  'Burn': '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496',
  
  // Lending Events
  'Supply': '0x2b627736bca15cd5381dcf80b0bf11fd197d01a037c52b927a881a10fb73ba61',
  'Borrow': '0xb3d084820fb1a9decffb176436bd02558d15fac9b0ddfed8c465bc7359d7dce0',
  'Repay': '0xa534c8dbe71f871f9f3530e97a74601fea17b426cae02e1c5aec07c5db2030290',
  'Withdraw': '0x3115d1449a7b732c986cba18244e897a450ad2e1c693c3b8e0bbacd1b1049df',
  
  // Yield Farming Events
  'Staked': '0x9e71bc8eea02a63969f509818f2dafb9254532904319f9dbda79b67bd34a5f3d',
  'Unstaked': '0x0f5bb82176feb1b5e747e28471aa92156a04d9f3ab9f45f28e2d704232b93f75',
  'RewardPaid': '0xe2403640ba68fed3a2f88b7557551d1993f84b99bb10ff833f0cf8db0c5e0486'
};

export class DeFiProtocolDetector {
  private static instance: DeFiProtocolDetector;
  private protocolCache: Map<string, DeFiProtocol> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): DeFiProtocolDetector {
    if (!DeFiProtocolDetector.instance) {
      DeFiProtocolDetector.instance = new DeFiProtocolDetector();
    }
    return DeFiProtocolDetector.instance;
  }

  async detectDeFiInteractions(
    contractInteractions: string[],
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction[]> {
    const interactions: DeFiInteraction[] = [];

    for (const contractAddress of contractInteractions) {
      const protocol = await this.identifyProtocol(contractAddress, provider);
      if (protocol) {
        const interaction = await this.analyzeInteraction(
          protocol,
          contractAddress,
          transactionData,
          logs,
          provider
        );
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    return interactions;
  }

  private async identifyProtocol(contractAddress: string, provider: JsonRpcProvider): Promise<DeFiProtocol | null> {
    // Check cache first
    const cached = this.protocolCache.get(contractAddress);
    if (cached) return cached;

    // Check known protocols
    const knownProtocol = KNOWN_DEFI_PROTOCOLS[contractAddress.toLowerCase()];
    if (knownProtocol) {
      this.protocolCache.set(contractAddress, knownProtocol);
      return knownProtocol;
    }

    // Try to infer protocol type from contract code
    const inferredProtocol = await this.inferProtocolFromContract(contractAddress, provider);
    if (inferredProtocol) {
      this.protocolCache.set(contractAddress, inferredProtocol);
      setTimeout(() => this.protocolCache.delete(contractAddress), this.CACHE_DURATION);
    }

    return inferredProtocol;
  }

  private async inferProtocolFromContract(contractAddress: string, provider: JsonRpcProvider): Promise<DeFiProtocol | null> {
    try {
      const code = await provider.getCode(contractAddress);
      if (code === '0x') return null;

      // Analyze bytecode patterns to infer protocol type
      const protocolType = await this.analyzeContractBytecode(code, contractAddress, provider);
      
      if (protocolType !== 'Unknown') {
        return {
          name: `Unknown ${protocolType}`,
          type: protocolType,
          address: contractAddress,
          description: `Detected ${protocolType} protocol`,
          verified: false,
          riskLevel: 'High' // Unknown protocols are high risk
        };
      }

      return null;
    } catch (error) {
      console.error('Error inferring protocol type:', error);
      return null;
    }
  }

  private async analyzeContractBytecode(
    bytecode: string,
    contractAddress: string,
    provider: JsonRpcProvider
  ): Promise<DeFiProtocol['type']> {
    // Try to call common DeFi functions to determine protocol type
    const contract = new Contract(contractAddress, [], provider);

    // Check for DEX functionality
    if (await this.hasFunction(contract, 'swapExactTokensForTokens') ||
        await this.hasFunction(contract, 'exactInputSingle')) {
      return 'DEX';
    }

    // Check for lending functionality
    if (await this.hasFunction(contract, 'supply') ||
        await this.hasFunction(contract, 'borrow')) {
      return 'Lending';
    }

    // Check for staking functionality
    if (await this.hasFunction(contract, 'stake') ||
        await this.hasFunction(contract, 'harvest')) {
      return 'Yield Farming';
    }

    // Check for bridge functionality
    if (await this.hasFunction(contract, 'bridge') ||
        await this.hasFunction(contract, 'depositETH')) {
      return 'Bridge';
    }

    return 'Unknown';
  }

  private async hasFunction(contract: Contract, functionName: string): Promise<boolean> {
    try {
      const signature = DEFI_FUNCTION_SIGNATURES[functionName as keyof typeof DEFI_FUNCTION_SIGNATURES];
      if (!signature) return false;

      // Try to estimate gas for the function call (will fail if function doesn't exist)
      await contract.getFunction(functionName).estimateGas();
      return true;
    } catch {
      return false;
    }
  }

  private async analyzeInteraction(
    protocol: DeFiProtocol,
    contractAddress: string,
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction | null> {
    const functionSelector = transactionData.data?.slice(0, 10);
    const actionType = this.identifyActionType(functionSelector, logs);
    
    if (!actionType) return null;

    const details = await this.extractInteractionDetails(
      protocol.type,
      transactionData,
      logs,
      provider
    );

    const analysis = this.generateInteractionAnalysis(protocol, actionType, details);

    return {
      protocol,
      actionType,
      confidence: this.calculateConfidence(protocol, actionType, details),
      details,
      analysis
    };
  }

  private identifyActionType(functionSelector: string, logs: any[]): string | null {
    // Map function selectors to action types
    for (const [action, selector] of Object.entries(DEFI_FUNCTION_SIGNATURES)) {
      if (functionSelector === selector) {
        return this.humanizeActionName(action);
      }
    }

    // Fallback to event analysis
    for (const log of logs) {
      for (const [event, signature] of Object.entries(DEFI_EVENT_SIGNATURES)) {
        if (log.topics[0] === signature) {
          return this.humanizeActionName(event);
        }
      }
    }

    return null;
  }

  private humanizeActionName(action: string): string {
    const actionMap: Record<string, string> = {
      'swapExactTokensForTokens': 'Token Swap',
      'swapTokensForExactTokens': 'Token Swap',
      'exactInputSingle': 'Single Token Swap',
      'supply': 'Supply Assets',
      'borrow': 'Borrow Assets',
      'repay': 'Repay Loan',
      'withdraw': 'Withdraw Assets',
      'stake': 'Stake Tokens',
      'unstake': 'Unstake Tokens',
      'harvest': 'Harvest Rewards',
      'bridge': 'Bridge Assets',
      'Swap': 'Token Swap',
      'Supply': 'Supply Assets',
      'Borrow': 'Borrow Assets',
      'Staked': 'Stake Tokens',
      'Unstaked': 'Unstake Tokens'
    };

    return actionMap[action] || action;
  }

  private async extractInteractionDetails(
    protocolType: DeFiProtocol['type'],
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction['details']> {
    const details: DeFiInteraction['details'] = {};

    switch (protocolType) {
      case 'DEX':
        return await this.extractDEXDetails(transactionData, logs, provider);
      case 'Lending':
        return await this.extractLendingDetails(transactionData, logs, provider);
      case 'Yield Farming':
        return await this.extractYieldFarmingDetails(transactionData, logs, provider);
      default:
        return details;
    }
  }

  private async extractDEXDetails(
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction['details']> {
    const details: DeFiInteraction['details'] = {
      fees: {
        protocol: 0.3, // Default 0.3% for most DEXes
        gas: 0,
        slippage: 0
      }
    };

    // Look for Swap events to extract swap details
    const swapEvents = logs.filter(log => 
      log.topics[0] === DEFI_EVENT_SIGNATURES['Swap']
    );

    if (swapEvents.length > 0) {
      const swapEvent = swapEvents[0];
      try {
        // Decode swap event (this would need proper ABI in production)
        details.estimatedValue = Math.random() * 10000; // Mock value
        details.fees!.slippage = Math.random() * 2; // Mock 0-2% slippage
      } catch (error) {
        console.error('Error decoding swap event:', error);
      }
    }

    return details;
  }

  private async extractLendingDetails(
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction['details']> {
    const details: DeFiInteraction['details'] = {
      fees: {
        protocol: 0, // Most lending protocols don't charge fees
        gas: 0,
        slippage: 0
      }
    };

    // Extract lending-specific details from logs
    const lendingEvents = logs.filter(log => 
      Object.values(DEFI_EVENT_SIGNATURES).includes(log.topics[0])
    );

    if (lendingEvents.length > 0) {
      details.estimatedValue = Math.random() * 50000; // Mock value
    }

    return details;
  }

  private async extractYieldFarmingDetails(
    transactionData: any,
    logs: any[],
    provider: JsonRpcProvider
  ): Promise<DeFiInteraction['details']> {
    const details: DeFiInteraction['details'] = {
      fees: {
        protocol: 0.1, // Small performance fee
        gas: 0,
        slippage: 0
      }
    };

    // Extract yield farming details
    const farmingEvents = logs.filter(log => 
      log.topics[0] === DEFI_EVENT_SIGNATURES['Staked'] ||
      log.topics[0] === DEFI_EVENT_SIGNATURES['Unstaked'] ||
      log.topics[0] === DEFI_EVENT_SIGNATURES['RewardPaid']
    );

    if (farmingEvents.length > 0) {
      details.estimatedValue = Math.random() * 25000; // Mock value
    }

    return details;
  }

  private generateInteractionAnalysis(
    protocol: DeFiProtocol,
    actionType: string,
    details: DeFiInteraction['details']
  ): DeFiInteraction['analysis'] {
    const analysis: DeFiInteraction['analysis'] = {
      purpose: this.describePurpose(protocol.type, actionType),
      riskFactors: this.identifyRiskFactors(protocol, actionType),
      opportunities: this.identifyOpportunities(protocol, actionType),
      recommendations: this.generateRecommendations(protocol, actionType, details)
    };

    return analysis;
  }

  private describePurpose(protocolType: DeFiProtocol['type'], actionType: string): string {
    const purposeMap: Record<string, Record<string, string>> = {
      'DEX': {
        'Token Swap': 'Exchange one token for another at current market rates',
        'Single Token Swap': 'Perform concentrated liquidity swap with precise control',
        'default': 'Interact with decentralized exchange protocol'
      },
      'Lending': {
        'Supply Assets': 'Provide liquidity to earn interest',
        'Borrow Assets': 'Take a loan against collateral',
        'Repay Loan': 'Repay borrowed assets to unlock collateral',
        'Withdraw Assets': 'Remove supplied assets from lending pool',
        'default': 'Interact with lending protocol'
      },
      'Yield Farming': {
        'Stake Tokens': 'Lock tokens to earn rewards',
        'Unstake Tokens': 'Unlock staked tokens and claim rewards',
        'Harvest Rewards': 'Claim accumulated farming rewards',
        'default': 'Participate in yield farming'
      }
    };

    const protocolPurposes = purposeMap[protocolType];
    return protocolPurposes?.[actionType] || protocolPurposes?.['default'] || 'Unknown DeFi interaction';
  }

  private identifyRiskFactors(protocol: DeFiProtocol, actionType: string): string[] {
    const commonRisks = ['Smart contract risk', 'Market volatility'];
    const risks: string[] = [...commonRisks];

    if (protocol.riskLevel === 'High' || !protocol.verified) {
      risks.push('Unverified protocol risk');
    }

    switch (protocol.type) {
      case 'DEX':
        risks.push('Slippage risk', 'MEV exposure', 'Price impact');
        break;
      case 'Lending':
        risks.push('Liquidation risk', 'Interest rate changes', 'Bad debt risk');
        break;
      case 'Yield Farming':
        risks.push('Impermanent loss', 'Token devaluation', 'Farming token volatility');
        break;
      case 'Bridge':
        risks.push('Cross-chain risk', 'Validator risk', 'Bridge security');
        break;
    }

    return risks;
  }

  private identifyOpportunities(protocol: DeFiProtocol, actionType: string): string[] {
    const opportunities: string[] = [];

    switch (protocol.type) {
      case 'DEX':
        opportunities.push('Arbitrage potential', 'Better price discovery', 'MEV capture');
        break;
      case 'Lending':
        opportunities.push('Passive income generation', 'Capital efficiency', 'Leverage opportunities');
        break;
      case 'Yield Farming':
        opportunities.push('High yield potential', 'Token rewards', 'Governance participation');
        break;
      case 'Bridge':
        opportunities.push('Cross-chain capital efficiency', 'New market access');
        break;
    }

    if (protocol.verified && protocol.riskLevel === 'Low') {
      opportunities.push('Low-risk DeFi exposure');
    }

    return opportunities;
  }

  private generateRecommendations(
    protocol: DeFiProtocol,
    actionType: string,
    details: DeFiInteraction['details']
  ): string[] {
    const recommendations: string[] = [];

    // General recommendations
    if (!protocol.verified) {
      recommendations.push('Verify protocol audits and security measures');
    }

    if (details.fees && details.fees.protocol > 1) {
      recommendations.push('Consider protocols with lower fees');
    }

    // Protocol-specific recommendations
    switch (protocol.type) {
      case 'DEX':
        recommendations.push('Monitor slippage tolerance');
        recommendations.push('Consider breaking large trades into smaller parts');
        if (details.fees && details.fees.slippage > 1) {
          recommendations.push('Reduce trade size to minimize price impact');
        }
        break;
        
      case 'Lending':
        recommendations.push('Monitor health factor to avoid liquidation');
        recommendations.push('Diversify across multiple protocols');
        break;
        
      case 'Yield Farming':
        recommendations.push('Understand impermanent loss risks');
        recommendations.push('Monitor farming token emissions');
        recommendations.push('Consider exit strategy for rewards');
        break;
    }

    return recommendations;
  }

  private calculateConfidence(
    protocol: DeFiProtocol,
    actionType: string,
    details: DeFiInteraction['details']
  ): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence for known protocols
    if (protocol.verified) confidence += 0.3;
    
    // Increase confidence for recognized action types
    if (actionType && actionType !== 'Unknown') confidence += 0.2;
    
    // Increase confidence if we have detailed analysis
    if (details.estimatedValue && details.estimatedValue > 0) confidence += 0.1;
    
    // Decrease confidence for high-risk protocols
    if (protocol.riskLevel === 'High') confidence -= 0.2;

    return Math.min(Math.max(confidence, 0), 1);
  }

  async analyzeDEXSwap(logs: any[], provider: JsonRpcProvider): Promise<DEXSwapAnalysis | null> {
    // Implementation for detailed DEX swap analysis
    // This would parse swap events and calculate detailed metrics
    return null; // Placeholder
  }

  async analyzeLendingOperation(logs: any[], provider: JsonRpcProvider): Promise<LendingProtocolAnalysis | null> {
    // Implementation for detailed lending analysis
    // This would parse lending events and calculate health factors, APRs, etc.
    return null; // Placeholder
  }

  async analyzeYieldFarming(logs: any[], provider: JsonRpcProvider): Promise<YieldFarmingAnalysis | null> {
    // Implementation for detailed yield farming analysis
    // This would parse staking events and calculate APRs, IL risk, etc.
    return null; // Placeholder
  }
}