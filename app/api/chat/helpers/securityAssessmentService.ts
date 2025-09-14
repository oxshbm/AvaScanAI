import { JsonRpcProvider } from 'ethers';

export interface SecurityThreat {
  type: 'High' | 'Medium' | 'Low' | 'Info';
  category: 'Smart Contract' | 'Transaction' | 'Economic' | 'Network' | 'User Behavior';
  description: string;
  evidence: string[];
  mitigation: string[];
  confidence: number;
}

export interface ContractSecurityInfo {
  address: string;
  isVerified: boolean;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  codeSize: number;
  deploymentAge: number;
  interactionHistory: {
    totalTransactions: number;
    uniqueUsers: number;
    volume24h: number;
  };
  securityFeatures: {
    hasProxy: boolean;
    hasMultisig: boolean;
    hasTimelock: boolean;
    hasUpgradeability: boolean;
  };
  vulnerabilities: string[];
  auditStatus: 'Audited' | 'Unaudited' | 'Unknown';
}

export interface TransactionSecurityAnalysis {
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  securityScore: number; // 0-100
  threats: SecurityThreat[];
  contractAnalysis: ContractSecurityInfo[];
  behavioralAnalysis: {
    isUnusual: boolean;
    patterns: string[];
    riskFactors: string[];
  };
  recommendations: {
    immediate: string[];
    longTerm: string[];
    monitoring: string[];
  };
  complianceCheck: {
    amlRisk: 'Low' | 'Medium' | 'High';
    sanctionedAddresses: string[];
    highRiskJurisdictions: boolean;
  };
}

// Known malicious patterns and addresses
const MALICIOUS_PATTERNS = {
  // Known scam contract patterns
  HONEYPOT_SIGNATURES: [
    '0x12345678', // Example signature
  ],
  
  // Suspicious function selectors
  SUSPICIOUS_FUNCTIONS: [
    '0xfb3bdb41', // swapETHForExactTokens with unusual parameters
    '0x2e1a7d4d', // withdraw(uint256) from suspicious contracts
  ],
  
  // Known phishing addresses (example list)
  KNOWN_SCAMMERS: [
    '0x0000000000000000000000000000000000000000', // Example
  ],
  
  // High-risk contract patterns
  HIGH_RISK_PATTERNS: [
    /^0x[0]{10,}/, // Addresses with many zeros (often fake tokens)
  ]
};

// Security rules and thresholds
const SECURITY_THRESHOLDS = {
  LARGE_VALUE_USD: 100000,
  HIGH_GAS_MULTIPLIER: 3,
  UNUSUAL_GAS_LIMIT: 1000000,
  HIGH_SLIPPAGE: 5,
  SUSPICIOUS_TOKEN_COUNT: 10,
  NEW_CONTRACT_DAYS: 7
};

export class SecurityAssessmentService {
  private static instance: SecurityAssessmentService;
  private securityCache: Map<string, ContractSecurityInfo> = new Map();
  private readonly CACHE_DURATION = 600000; // 10 minutes

  private constructor() {}

  static getInstance(): SecurityAssessmentService {
    if (!SecurityAssessmentService.instance) {
      SecurityAssessmentService.instance = new SecurityAssessmentService();
    }
    return SecurityAssessmentService.instance;
  }

  async performSecurityAnalysis(
    transactionData: any,
    contractInteractions: string[],
    transfers: any[],
    defiAnalysis: any[],
    advancedAnalysis: any,
    provider: JsonRpcProvider
  ): Promise<TransactionSecurityAnalysis> {
    console.log('Starting comprehensive security analysis...');

    // Analyze all contracts involved
    const contractAnalysis = await this.analyzeContracts(contractInteractions, provider);
    
    // Detect security threats
    const threats = await this.detectSecurityThreats(
      transactionData,
      contractInteractions,
      transfers,
      defiAnalysis,
      advancedAnalysis,
      contractAnalysis
    );
    
    // Analyze transaction behavior
    const behavioralAnalysis = this.analyzeBehavior(
      transactionData,
      transfers,
      advancedAnalysis
    );
    
    // Perform compliance checks
    const complianceCheck = await this.performComplianceCheck(
      transactionData,
      contractInteractions,
      transfers
    );
    
    // Calculate overall risk and security score
    const overallRisk = this.calculateOverallRisk(threats, contractAnalysis, behavioralAnalysis);
    const securityScore = this.calculateSecurityScore(threats, contractAnalysis, behavioralAnalysis);
    
    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(
      threats,
      contractAnalysis,
      behavioralAnalysis,
      complianceCheck
    );

    return {
      overallRisk,
      securityScore,
      threats,
      contractAnalysis,
      behavioralAnalysis,
      recommendations,
      complianceCheck
    };
  }

  private async analyzeContracts(
    contractAddresses: string[],
    provider: JsonRpcProvider
  ): Promise<ContractSecurityInfo[]> {
    const analyses: ContractSecurityInfo[] = [];

    for (const address of contractAddresses) {
      try {
        // Check cache first
        const cached = this.securityCache.get(address);
        if (cached) {
          analyses.push(cached);
          continue;
        }

        const contractInfo = await this.analyzeContract(address, provider);
        analyses.push(contractInfo);
        
        // Cache the result
        this.securityCache.set(address, contractInfo);
        setTimeout(() => this.securityCache.delete(address), this.CACHE_DURATION);
      } catch (error) {
        console.error(`Error analyzing contract ${address}:`, error);
        
        // Add minimal info for failed analysis
        analyses.push({
          address,
          isVerified: false,
          riskLevel: 'High',
          codeSize: 0,
          deploymentAge: 0,
          interactionHistory: {
            totalTransactions: 0,
            uniqueUsers: 0,
            volume24h: 0
          },
          securityFeatures: {
            hasProxy: false,
            hasMultisig: false,
            hasTimelock: false,
            hasUpgradeability: false
          },
          vulnerabilities: ['Analysis failed'],
          auditStatus: 'Unknown'
        });
      }
    }

    return analyses;
  }

  private async analyzeContract(address: string, provider: JsonRpcProvider): Promise<ContractSecurityInfo> {
    const code = await provider.getCode(address);
    const isContract = code !== '0x';
    
    if (!isContract) {
      return {
        address,
        isVerified: true, // EOAs are considered "verified"
        riskLevel: 'Low',
        codeSize: 0,
        deploymentAge: 999, // Old enough to be safe
        interactionHistory: {
          totalTransactions: 0,
          uniqueUsers: 0,
          volume24h: 0
        },
        securityFeatures: {
          hasProxy: false,
          hasMultisig: false,
          hasTimelock: false,
          hasUpgradeability: false
        },
        vulnerabilities: [],
        auditStatus: 'Unknown'
      };
    }

    // Analyze contract bytecode for security features and vulnerabilities
    const securityFeatures = this.analyzeContractFeatures(code);
    const vulnerabilities = this.detectVulnerabilities(code, address);
    const riskLevel = this.assessContractRisk(code, securityFeatures, vulnerabilities);
    
    // Mock deployment age (in production, would need creation transaction)
    const deploymentAge = Math.floor(Math.random() * 365); // 0-365 days
    
    // Mock interaction history (in production, would need historical data)
    const interactionHistory = {
      totalTransactions: Math.floor(Math.random() * 10000),
      uniqueUsers: Math.floor(Math.random() * 1000),
      volume24h: Math.random() * 1000000
    };

    return {
      address,
      isVerified: this.assessVerificationStatus(code, address),
      riskLevel,
      codeSize: code.length,
      deploymentAge,
      interactionHistory,
      securityFeatures,
      vulnerabilities,
      auditStatus: this.assessAuditStatus(address, code)
    };
  }

  private analyzeContractFeatures(bytecode: string): ContractSecurityInfo['securityFeatures'] {
    // Analyze bytecode for common security patterns
    return {
      hasProxy: bytecode.includes('implementation') || bytecode.includes('proxy'),
      hasMultisig: bytecode.includes('multisig') || bytecode.includes('multiowner'),
      hasTimelock: bytecode.includes('timelock') || bytecode.includes('delay'),
      hasUpgradeability: bytecode.includes('upgrade') || bytecode.includes('initialize')
    };
  }

  private detectVulnerabilities(bytecode: string, address: string): string[] {
    const vulnerabilities: string[] = [];

    // Check for known malicious patterns
    for (const pattern of MALICIOUS_PATTERNS.HIGH_RISK_PATTERNS) {
      if (pattern.test(address)) {
        vulnerabilities.push('Suspicious address pattern');
      }
    }

    // Check bytecode size (very small contracts are suspicious)
    if (bytecode.length < 100) {
      vulnerabilities.push('Unusually small contract code');
    }

    // Check for potential honeypot patterns
    if (this.detectHoneypotPatterns(bytecode)) {
      vulnerabilities.push('Potential honeypot contract');
    }

    // Check for reentrancy vulnerabilities (simplified)
    if (this.detectReentrancyVulnerability(bytecode)) {
      vulnerabilities.push('Potential reentrancy vulnerability');
    }

    // Check for unchecked external calls
    if (this.detectUncheckedCalls(bytecode)) {
      vulnerabilities.push('Unchecked external calls detected');
    }

    return vulnerabilities;
  }

  private detectHoneypotPatterns(bytecode: string): boolean {
    // Simplified honeypot detection
    const suspiciousPatterns = [
      'selfdestruct',
      'delegatecall',
      'unusual transfer restrictions'
    ];
    
    return suspiciousPatterns.some(pattern => 
      bytecode.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private detectReentrancyVulnerability(bytecode: string): boolean {
    // Simplified reentrancy detection
    const hasExternalCall = bytecode.includes('call');
    const hasStateChange = bytecode.includes('sstore');
    
    // This is a very simplified check
    return hasExternalCall && hasStateChange;
  }

  private detectUncheckedCalls(bytecode: string): boolean {
    // Check for call operations without return value checks
    return bytecode.includes('call') && !bytecode.includes('require');
  }

  private assessContractRisk(
    bytecode: string,
    features: ContractSecurityInfo['securityFeatures'],
    vulnerabilities: string[]
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    let riskScore = 0;

    // Risk factors
    if (vulnerabilities.length > 0) riskScore += vulnerabilities.length * 20;
    if (bytecode.length < 200) riskScore += 30; // Very small contracts
    if (!features.hasMultisig && features.hasUpgradeability) riskScore += 25; // Upgradeable without multisig
    if (features.hasProxy && !features.hasTimelock) riskScore += 15; // Proxy without timelock

    if (riskScore >= 60) return 'Critical';
    if (riskScore >= 40) return 'High';
    if (riskScore >= 20) return 'Medium';
    return 'Low';
  }

  private assessVerificationStatus(bytecode: string, address: string): boolean {
    // In production, this would check against verification databases
    // For now, use heuristics
    return bytecode.length > 1000 && !MALICIOUS_PATTERNS.KNOWN_SCAMMERS.includes(address);
  }

  private assessAuditStatus(address: string, bytecode: string): 'Audited' | 'Unaudited' | 'Unknown' {
    // In production, this would check against audit databases
    // For now, assume larger contracts are more likely to be audited
    if (bytecode.length > 10000) return 'Audited';
    if (bytecode.length > 5000) return 'Unknown';
    return 'Unaudited';
  }

  private async detectSecurityThreats(
    transactionData: any,
    contractInteractions: string[],
    transfers: any[],
    defiAnalysis: any[],
    advancedAnalysis: any,
    contractAnalysis: ContractSecurityInfo[]
  ): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // Check for large value transactions
    if (advancedAnalysis.usdValue.total > SECURITY_THRESHOLDS.LARGE_VALUE_USD) {
      threats.push({
        type: 'Medium',
        category: 'Economic',
        description: 'Large value transaction detected',
        evidence: [`Transaction value: $${advancedAnalysis.usdValue.total.toLocaleString()}`],
        mitigation: ['Verify transaction details carefully', 'Consider breaking into smaller transactions'],
        confidence: 0.9
      });
    }

    // Check for high-risk contracts
    const highRiskContracts = contractAnalysis.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical');
    if (highRiskContracts.length > 0) {
      threats.push({
        type: 'High',
        category: 'Smart Contract',
        description: 'Interaction with high-risk contracts',
        evidence: highRiskContracts.map(c => `${c.address}: ${c.vulnerabilities.join(', ')}`),
        mitigation: ['Avoid interacting with unverified contracts', 'Research contract thoroughly'],
        confidence: 0.8
      });
    }

    // Check for unusual gas patterns
    if (this.detectUnusualGasPattern(transactionData, advancedAnalysis)) {
      threats.push({
        type: 'Medium',
        category: 'Transaction',
        description: 'Unusual gas usage pattern detected',
        evidence: [`Gas used: ${transactionData.gasUsed}`, `Gas limit: ${transactionData.gasLimit}`],
        mitigation: ['Review transaction parameters', 'Check for potential gas griefing'],
        confidence: 0.7
      });
    }

    // Check for failed transactions
    if (transactionData.status === 'FAILED') {
      threats.push({
        type: 'High',
        category: 'Transaction',
        description: 'Transaction failed',
        evidence: ['Transaction status: FAILED'],
        mitigation: ['Investigate failure reason', 'Check contract state before retrying'],
        confidence: 1.0
      });
    }

    // Check for MEV exposure
    if (advancedAnalysis.marketImpact.arbitrageOpportunities.length > 0) {
      threats.push({
        type: 'Medium',
        category: 'Economic',
        description: 'MEV exposure detected',
        evidence: [`${advancedAnalysis.marketImpact.arbitrageOpportunities.length} arbitrage opportunities`],
        mitigation: ['Use private mempool', 'Implement MEV protection'],
        confidence: 0.6
      });
    }

    // Check for unverified DeFi protocols
    const unverifiedProtocols = defiAnalysis.filter(d => !d.protocol.verified);
    if (unverifiedProtocols.length > 0) {
      threats.push({
        type: 'High',
        category: 'Smart Contract',
        description: 'Interaction with unverified DeFi protocols',
        evidence: unverifiedProtocols.map(p => p.protocol.name),
        mitigation: ['Research protocol thoroughly', 'Start with small amounts', 'Check for audits'],
        confidence: 0.8
      });
    }

    return threats;
  }

  private detectUnusualGasPattern(transactionData: any, advancedAnalysis: any): boolean {
    const gasUsed = Number(transactionData.gasUsed);
    const gasLimit = Number(transactionData.gasLimit);
    const gasPrice = Number(transactionData.gasPrice);
    
    // Check for unusually high gas limit
    if (gasLimit > SECURITY_THRESHOLDS.UNUSUAL_GAS_LIMIT) return true;
    
    // Check for gas price significantly above average
    const avgGasPrice = Number(advancedAnalysis.gasAnalysis.averageGasPrice);
    if (gasPrice > avgGasPrice * SECURITY_THRESHOLDS.HIGH_GAS_MULTIPLIER) return true;
    
    // Check for very low gas efficiency
    const efficiency = gasUsed / gasLimit;
    if (efficiency < 0.1) return true; // Less than 10% efficiency
    
    return false;
  }

  private analyzeBehavior(
    transactionData: any,
    transfers: any[],
    advancedAnalysis: any
  ): TransactionSecurityAnalysis['behavioralAnalysis'] {
    const patterns: string[] = [];
    const riskFactors: string[] = [];
    let isUnusual = false;

    // Analyze transfer patterns
    if (transfers.length > SECURITY_THRESHOLDS.SUSPICIOUS_TOKEN_COUNT) {
      patterns.push('High number of token transfers');
      riskFactors.push('Complex multi-token transaction');
      isUnusual = true;
    }

    // Analyze value patterns
    if (advancedAnalysis.usdValue.total > SECURITY_THRESHOLDS.LARGE_VALUE_USD) {
      patterns.push('Large value transaction');
      riskFactors.push('High financial exposure');
    }

    // Analyze timing patterns
    if (advancedAnalysis.gasAnalysis.networkCongestion === 'High') {
      patterns.push('Transaction during network congestion');
      riskFactors.push('Higher MEV exposure risk');
    }

    // Check for round numbers (often suspicious)
    const hasRoundNumbers = transfers.some(t => {
      const value = parseFloat(t.value);
      return value % 1000 === 0 || value % 10000 === 0;
    });
    
    if (hasRoundNumbers) {
      patterns.push('Round number transfers detected');
    }

    return {
      isUnusual,
      patterns,
      riskFactors
    };
  }

  private async performComplianceCheck(
    transactionData: any,
    contractInteractions: string[],
    transfers: any[]
  ): Promise<TransactionSecurityAnalysis['complianceCheck']> {
    // This would integrate with real compliance APIs in production
    const allAddresses = [
      transactionData.from,
      transactionData.to,
      ...contractInteractions,
      ...transfers.flatMap(t => [t.from, t.to])
    ].filter(Boolean);

    const sanctionedAddresses = allAddresses.filter(addr => 
      MALICIOUS_PATTERNS.KNOWN_SCAMMERS.includes(addr)
    );

    // Mock AML risk assessment
    let amlRisk: 'Low' | 'Medium' | 'High' = 'Low';
    if (sanctionedAddresses.length > 0) amlRisk = 'High';
    else if (transfers.length > 10) amlRisk = 'Medium';

    return {
      amlRisk,
      sanctionedAddresses,
      highRiskJurisdictions: false // Would need geo-location data
    };
  }

  private calculateOverallRisk(
    threats: SecurityThreat[],
    contractAnalysis: ContractSecurityInfo[],
    behavioralAnalysis: TransactionSecurityAnalysis['behavioralAnalysis']
  ): 'Low' | 'Medium' | 'High' | 'Critical' {
    let riskScore = 0;

    // Threat-based risk
    threats.forEach(threat => {
      switch (threat.type) {
        case 'Critical': riskScore += 40; break;
        case 'High': riskScore += 25; break;
        case 'Medium': riskScore += 15; break;
        case 'Low': riskScore += 5; break;
      }
    });

    // Contract-based risk
    contractAnalysis.forEach(contract => {
      switch (contract.riskLevel) {
        case 'Critical': riskScore += 30; break;
        case 'High': riskScore += 20; break;
        case 'Medium': riskScore += 10; break;
        case 'Low': riskScore += 0; break;
      }
    });

    // Behavioral risk
    if (behavioralAnalysis.isUnusual) riskScore += 15;
    riskScore += behavioralAnalysis.riskFactors.length * 5;

    if (riskScore >= 80) return 'Critical';
    if (riskScore >= 50) return 'High';
    if (riskScore >= 25) return 'Medium';
    return 'Low';
  }

  private calculateSecurityScore(
    threats: SecurityThreat[],
    contractAnalysis: ContractSecurityInfo[],
    behavioralAnalysis: TransactionSecurityAnalysis['behavioralAnalysis']
  ): number {
    let score = 100; // Start with perfect score

    // Deduct for threats
    threats.forEach(threat => {
      switch (threat.type) {
        case 'Critical': score -= 30; break;
        case 'High': score -= 20; break;
        case 'Medium': score -= 10; break;
        case 'Low': score -= 5; break;
      }
    });

    // Deduct for contract risks
    contractAnalysis.forEach(contract => {
      switch (contract.riskLevel) {
        case 'Critical': score -= 25; break;
        case 'High': score -= 15; break;
        case 'Medium': score -= 8; break;
        case 'Low': score -= 0; break;
      }
    });

    // Deduct for behavioral risks
    if (behavioralAnalysis.isUnusual) score -= 10;
    score -= behavioralAnalysis.riskFactors.length * 3;

    return Math.max(0, Math.min(100, score));
  }

  private generateSecurityRecommendations(
    threats: SecurityThreat[],
    contractAnalysis: ContractSecurityInfo[],
    behavioralAnalysis: TransactionSecurityAnalysis['behavioralAnalysis'],
    complianceCheck: TransactionSecurityAnalysis['complianceCheck']
  ): TransactionSecurityAnalysis['recommendations'] {
    const immediate: string[] = [];
    const longTerm: string[] = [];
    const monitoring: string[] = [];

    // Immediate actions based on threats
    if (threats.some(t => t.type === 'Critical' || t.type === 'High')) {
      immediate.push('Stop transaction and review all parameters');
      immediate.push('Verify contract addresses and functions');
    }

    if (complianceCheck.sanctionedAddresses.length > 0) {
      immediate.push('Do not proceed - sanctioned addresses detected');
    }

    // Long-term recommendations
    if (contractAnalysis.some(c => c.riskLevel === 'High' && !c.isVerified)) {
      longTerm.push('Only interact with verified and audited contracts');
    }

    if (behavioralAnalysis.isUnusual) {
      longTerm.push('Establish consistent transaction patterns');
    }

    longTerm.push('Implement transaction monitoring and alerts');
    longTerm.push('Regular security audits of frequently used contracts');

    // Monitoring recommendations
    monitoring.push('Monitor transaction status and confirmations');
    monitoring.push('Track gas price trends for optimization');
    monitoring.push('Watch for unusual account activity');

    if (threats.some(t => t.category === 'Economic')) {
      monitoring.push('Monitor market conditions and slippage');
    }

    return { immediate, longTerm, monitoring };
  }
}