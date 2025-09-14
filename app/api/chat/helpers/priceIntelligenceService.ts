import { JsonRpcProvider } from 'ethers';

export interface PriceData {
  symbol: string;
  address: string;
  priceUSD: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
  source: string;
  confidence: number;
}

export interface TokenPriceInfo {
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  priceData: PriceData | null;
  valueUSD: number;
  marketAnalysis: {
    volatility: 'Low' | 'Medium' | 'High';
    trend: 'Bullish' | 'Bearish' | 'Neutral';
    riskLevel: 'Low' | 'Medium' | 'High';
  };
}

export interface GasPriceAnalysis {
  currentGasPrice: bigint;
  averageGasPrice: bigint;
  optimalGasPrice: bigint;
  networkCongestion: 'Low' | 'Medium' | 'High';
  recommendations: {
    timing: string;
    optimization: string[];
    costSaving: number;
  };
  historicalTrends: {
    last1h: number;
    last24h: number;
    last7d: number;
  };
}

export interface DeFiProtocolAnalysis {
  protocol: string;
  type: 'DEX' | 'Lending' | 'Yield Farming' | 'Staking' | 'Bridge' | 'Unknown';
  confidence: number;
  analysis: {
    slippage?: number;
    priceImpact?: number;
    liquidityDepth?: number;
    apr?: number;
    impermanentLoss?: number;
    fees?: {
      protocol: number;
      gas: number;
      total: number;
    };
  };
  risks: string[];
  opportunities: string[];
}

export interface AdvancedTransactionAnalysis {
  usdValue: {
    total: number;
    transfers: TokenPriceInfo[];
    fees: number;
  };
  profitLoss: {
    realized: number;
    unrealized: number;
    breakdown: Array<{
      token: string;
      pnl: number;
      reason: string;
    }>;
  };
  gasAnalysis: GasPriceAnalysis;
  defiAnalysis: DeFiProtocolAnalysis[];
  riskAssessment: {
    overall: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: Array<{
      type: string;
      risk: 'Low' | 'Medium' | 'High';
      description: string;
    }>;
    recommendations: string[];
  };
  marketImpact: {
    priceMovement: number;
    volumeSignificance: 'Negligible' | 'Minor' | 'Moderate' | 'Significant';
    arbitrageOpportunities: Array<{
      protocol: string;
      potential: number;
      risk: string;
    }>;
  };
}

// Known DeFi protocols on Avalanche
const DEFI_PROTOCOLS = {
  // DEX protocols
  '0x1234': { name: 'Avalanche DEX', type: 'DEX' as const },
  '0x5678': { name: 'Uniswap V3 (Avalanche)', type: 'DEX' as const },
  // Add more as they deploy to Avalanche
};

// Known token contracts with price feeds
const PRICE_FEEDS = {
  'AVAX': {
    sources: ['coingecko', 'binance', 'coinbase'],
    coingeckoId: 'tezos'
  },
  'USDC': {
    sources: ['coingecko', 'binance'],
    coingeckoId: 'usd-coin'
  },
  'USDT': {
    sources: ['coingecko', 'binance'],
    coingeckoId: 'tether'
  },
  'ETH': {
    sources: ['coingecko', 'binance'],
    coingeckoId: 'ethereum'
  }
};

export class PriceIntelligenceService {
  private static instance: PriceIntelligenceService;
  private priceCache: Map<string, PriceData> = new Map();
  private gasCache: Map<string, GasPriceAnalysis> = new Map();
  private readonly CACHE_DURATION = 60000; // 1 minute for prices
  private readonly GAS_CACHE_DURATION = 30000; // 30 seconds for gas

  private constructor() {}

  static getInstance(): PriceIntelligenceService {
    if (!PriceIntelligenceService.instance) {
      PriceIntelligenceService.instance = new PriceIntelligenceService();
    }
    return PriceIntelligenceService.instance;
  }

  async getAdvancedAnalysis(
    transfers: any[],
    gasData: any,
    contractInteractions: string[],
    provider: JsonRpcProvider
  ): Promise<AdvancedTransactionAnalysis> {
    // Get price data for all tokens
    const tokenPrices = await this.analyzeTokenTransfers(transfers);
    
    // Analyze gas efficiency and optimization
    const gasAnalysis = await this.analyzeGasEfficiency(gasData, provider);
    
    // Detect and analyze DeFi protocols
    const defiAnalysis = await this.analyzeDeFiProtocols(contractInteractions, transfers);
    
    // Calculate total USD values
    const totalUSDValue = tokenPrices.reduce((sum, t) => sum + t.valueUSD, 0);
    const feeUSD = await this.calculateFeeInUSD(gasData);
    
    // Calculate P&L
    const profitLoss = await this.calculateProfitLoss(tokenPrices, transfers);
    
    // Assess risks
    const riskAssessment = this.assessTransactionRisks(tokenPrices, defiAnalysis, gasAnalysis);
    
    // Analyze market impact
    const marketImpact = await this.analyzeMarketImpact(tokenPrices, totalUSDValue);

    return {
      usdValue: {
        total: totalUSDValue,
        transfers: tokenPrices,
        fees: feeUSD
      },
      profitLoss,
      gasAnalysis,
      defiAnalysis,
      riskAssessment,
      marketImpact
    };
  }

  private async analyzeTokenTransfers(transfers: any[]): Promise<TokenPriceInfo[]> {
    const results: TokenPriceInfo[] = [];
    
    for (const transfer of transfers) {
      if (!transfer.token) continue;
      
      const priceData = await this.getTokenPrice(transfer.token.symbol, transfer.token.address);
      const valueUSD = priceData ? this.calculateUSDValue(transfer.value, transfer.token.decimals, priceData.priceUSD) : 0;
      
      const marketAnalysis = this.analyzeTokenMarket(priceData);
      
      results.push({
        token: transfer.token,
        priceData,
        valueUSD,
        marketAnalysis
      });
    }
    
    return results;
  }

  private async getTokenPrice(symbol: string, address: string): Promise<PriceData | null> {
    const cacheKey = `${symbol}-${address}`;
    const cached = this.priceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.lastUpdated < this.CACHE_DURATION) {
      return cached;
    }

    try {
      // Try multiple sources for price data
      const priceData = await this.fetchPriceFromSources(symbol);
      
      if (priceData) {
        this.priceCache.set(cacheKey, priceData);
        setTimeout(() => this.priceCache.delete(cacheKey), this.CACHE_DURATION);
      }
      
      return priceData;
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error);
      return null;
    }
  }

  private async fetchPriceFromSources(symbol: string): Promise<PriceData | null> {
    const feedConfig = PRICE_FEEDS[symbol as keyof typeof PRICE_FEEDS];
    if (!feedConfig) return null;

    // Try CoinGecko first
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${feedConfig.coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        const data = await response.json();
        const tokenData = data[feedConfig.coingeckoId];
        
        if (tokenData) {
          return {
            symbol,
            address: 'external',
            priceUSD: tokenData.usd,
            priceChange24h: tokenData.usd_24h_change || 0,
            volume24h: tokenData.usd_24h_vol || 0,
            marketCap: tokenData.usd_market_cap || 0,
            lastUpdated: Date.now(),
            source: 'CoinGecko',
            confidence: 0.95
          };
        }
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
    }

    // Fallback to mock data for development
    return this.getMockPriceData(symbol);
  }

  private getMockPriceData(symbol: string): PriceData | null {
    const mockPrices: Record<string, number> = {
      'AVAX': 0.85,
      'USDC': 1.00,
      'USDT': 1.00,
      'ETH': 2400.00,
      'BTC': 45000.00
    };

    const price = mockPrices[symbol];
    if (!price) return null;

    return {
      symbol,
      address: 'mock',
      priceUSD: price,
      priceChange24h: (Math.random() - 0.5) * 10, // Random -5% to +5%
      volume24h: Math.random() * 1000000,
      marketCap: price * 1000000000,
      lastUpdated: Date.now(),
      source: 'Mock',
      confidence: 0.7
    };
  }

  private calculateUSDValue(value: string, decimals: number, priceUSD: number): number {
    const tokenAmount = parseFloat(value) / Math.pow(10, decimals);
    return tokenAmount * priceUSD;
  }

  private analyzeTokenMarket(priceData: PriceData | null): TokenPriceInfo['marketAnalysis'] {
    if (!priceData) {
      return {
        volatility: 'High',
        trend: 'Neutral',
        riskLevel: 'High'
      };
    }

    const volatility = Math.abs(priceData.priceChange24h) > 10 ? 'High' :
                     Math.abs(priceData.priceChange24h) > 5 ? 'Medium' : 'Low';
    
    const trend = priceData.priceChange24h > 2 ? 'Bullish' :
                 priceData.priceChange24h < -2 ? 'Bearish' : 'Neutral';
    
    const riskLevel = volatility === 'High' || priceData.confidence < 0.8 ? 'High' :
                     volatility === 'Medium' ? 'Medium' : 'Low';

    return { volatility, trend, riskLevel };
  }

  private async analyzeGasEfficiency(gasData: any, provider: JsonRpcProvider): Promise<GasPriceAnalysis> {
    const chainId = (await provider.getNetwork()).chainId.toString();
    const cached = this.gasCache.get(chainId);
    
    if (cached && Date.now() - cached.lastUpdated < this.GAS_CACHE_DURATION) {
      return cached;
    }

    try {
      // Get current network gas price
      const currentGasPrice = await provider.getFeeData();
      const gasPrice = currentGasPrice.gasPrice || 0n;
      
      // Mock historical data for now - in production, use historical API
      const analysis: GasPriceAnalysis = {
        currentGasPrice: gasPrice,
        averageGasPrice: gasPrice * 110n / 100n, // 10% higher average
        optimalGasPrice: gasPrice * 90n / 100n,  // 10% lower optimal
        networkCongestion: this.assessNetworkCongestion(gasPrice),
        recommendations: {
          timing: this.getTimingRecommendation(gasPrice),
          optimization: this.getOptimizationSuggestions(gasData),
          costSaving: this.calculatePotentialSavings(gasData, gasPrice)
        },
        historicalTrends: {
          last1h: Math.random() * 20 - 10, // Mock -10% to +10%
          last24h: Math.random() * 40 - 20, // Mock -20% to +20%
          last7d: Math.random() * 60 - 30   // Mock -30% to +30%
        }
      };

      this.gasCache.set(chainId, analysis);
      setTimeout(() => this.gasCache.delete(chainId), this.GAS_CACHE_DURATION);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing gas efficiency:', error);
      return this.getDefaultGasAnalysis();
    }
  }

  private assessNetworkCongestion(gasPrice: bigint): 'Low' | 'Medium' | 'High' {
    const gasPriceGwei = Number(gasPrice) / 1e9;
    
    if (gasPriceGwei < 2) return 'Low';
    if (gasPriceGwei < 10) return 'Medium';
    return 'High';
  }

  private getTimingRecommendation(gasPrice: bigint): string {
    const congestion = this.assessNetworkCongestion(gasPrice);
    
    switch (congestion) {
      case 'Low': return 'Optimal time for transactions';
      case 'Medium': return 'Consider waiting for lower gas prices';
      case 'High': return 'Wait for network congestion to decrease';
    }
  }

  private getOptimizationSuggestions(gasData: any): string[] {
    const suggestions = ['Use appropriate gas limit to avoid overpaying'];
    
    if (gasData.gasUsed && gasData.gasLimit) {
      const efficiency = Number(gasData.gasUsed) / Number(gasData.gasLimit);
      if (efficiency < 0.7) {
        suggestions.push('Gas limit was too high - consider lowering for future transactions');
      }
    }
    
    suggestions.push('Batch multiple operations when possible');
    suggestions.push('Consider using Avalanche\'s low-cost L2 benefits');
    
    return suggestions;
  }

  private calculatePotentialSavings(gasData: any, currentGasPrice: bigint): number {
    // Calculate potential savings with optimal gas price
    const optimalPrice = currentGasPrice * 90n / 100n;
    const currentCost = Number(gasData.gasUsed || 0) * Number(currentGasPrice);
    const optimalCost = Number(gasData.gasUsed || 0) * Number(optimalPrice);
    
    return ((currentCost - optimalCost) / currentCost) * 100;
  }

  private async analyzeDeFiProtocols(contractInteractions: string[], transfers: any[]): Promise<DeFiProtocolAnalysis[]> {
    const analyses: DeFiProtocolAnalysis[] = [];
    
    for (const contractAddress of contractInteractions) {
      const protocol = DEFI_PROTOCOLS[contractAddress as keyof typeof DEFI_PROTOCOLS];
      
      if (protocol) {
        const analysis = await this.analyzeSpecificProtocol(protocol, contractAddress, transfers);
        analyses.push(analysis);
      } else {
        // Try to infer protocol type from interactions
        const inferredAnalysis = await this.inferProtocolType(contractAddress, transfers);
        if (inferredAnalysis) {
          analyses.push(inferredAnalysis);
        }
      }
    }
    
    return analyses;
  }

  private async analyzeSpecificProtocol(
    protocol: { name: string; type: 'DEX' | 'Lending' | 'Yield Farming' | 'Staking' | 'Bridge' },
    contractAddress: string,
    transfers: any[]
  ): Promise<DeFiProtocolAnalysis> {
    const analysis: DeFiProtocolAnalysis = {
      protocol: protocol.name,
      type: protocol.type,
      confidence: 0.9,
      analysis: {},
      risks: [],
      opportunities: []
    };

    // Analyze based on protocol type
    switch (protocol.type) {
      case 'DEX':
        analysis.analysis = await this.analyzeDEXInteraction(transfers);
        analysis.risks = ['Slippage risk', 'MEV exposure', 'Smart contract risk'];
        analysis.opportunities = ['Arbitrage potential', 'Liquidity provision'];
        break;
        
      case 'Lending':
        analysis.risks = ['Liquidation risk', 'Interest rate volatility'];
        analysis.opportunities = ['Yield generation', 'Leverage opportunities'];
        break;
        
      case 'Yield Farming':
        analysis.risks = ['Impermanent loss', 'Token price volatility', 'Smart contract risk'];
        analysis.opportunities = ['High APY potential', 'Token rewards'];
        break;
    }

    return analysis;
  }

  private async analyzeDEXInteraction(transfers: any[]): Promise<DeFiProtocolAnalysis['analysis']> {
    if (transfers.length >= 2) {
      // Likely a swap
      const tokenIn = transfers.find(t => t.from !== '0x0000000000000000000000000000000000000000');
      const tokenOut = transfers.find(t => t.to !== '0x0000000000000000000000000000000000000000');
      
      if (tokenIn && tokenOut) {
        return {
          slippage: Math.random() * 2, // Mock 0-2% slippage
          priceImpact: Math.random() * 1, // Mock 0-1% price impact
          fees: {
            protocol: 0.3, // 0.3% typical DEX fee
            gas: 0.05,
            total: 0.35
          }
        };
      }
    }
    
    return {};
  }

  private async inferProtocolType(contractAddress: string, transfers: any[]): Promise<DeFiProtocolAnalysis | null> {
    // Basic heuristics to infer protocol type
    if (transfers.length >= 2) {
      return {
        protocol: 'Unknown DEX',
        type: 'DEX',
        confidence: 0.6,
        analysis: {},
        risks: ['Unknown smart contract risk'],
        opportunities: ['Potential trading opportunity']
      };
    }
    
    return null;
  }

  private async calculateProfitLoss(tokenPrices: TokenPriceInfo[], transfers: any[]): Promise<AdvancedTransactionAnalysis['profitLoss']> {
    // This would require historical position data in a real implementation
    // For now, we'll provide a basic analysis
    
    const breakdown = tokenPrices.map(tp => ({
      token: tp.token.symbol,
      pnl: tp.valueUSD * (Math.random() * 0.2 - 0.1), // Mock -10% to +10%
      reason: tp.marketAnalysis.trend === 'Bullish' ? 'Price appreciation' : 
              tp.marketAnalysis.trend === 'Bearish' ? 'Price depreciation' : 'No significant change'
    }));

    return {
      realized: breakdown.reduce((sum, b) => sum + Math.max(0, b.pnl), 0),
      unrealized: breakdown.reduce((sum, b) => sum + Math.min(0, b.pnl), 0),
      breakdown
    };
  }

  private assessTransactionRisks(
    tokenPrices: TokenPriceInfo[],
    defiAnalysis: DeFiProtocolAnalysis[],
    gasAnalysis: GasPriceAnalysis
  ): AdvancedTransactionAnalysis['riskAssessment'] {
    const factors: Array<{ type: string; risk: 'Low' | 'Medium' | 'High'; description: string }> = [];
    
    // Token volatility risks
    tokenPrices.forEach(tp => {
      if (tp.marketAnalysis.riskLevel === 'High') {
        factors.push({
          type: 'Token Volatility',
          risk: 'High',
          description: `${tp.token.symbol} shows high volatility`
        });
      }
    });

    // DeFi protocol risks
    defiAnalysis.forEach(da => {
      da.risks.forEach(risk => {
        factors.push({
          type: 'DeFi Protocol',
          risk: 'Medium',
          description: risk
        });
      });
    });

    // Gas efficiency risks
    if (gasAnalysis.networkCongestion === 'High') {
      factors.push({
        type: 'Network Congestion',
        risk: 'Medium',
        description: 'High gas prices due to network congestion'
      });
    }

    const overallRisk = this.calculateOverallRisk(factors);
    
    return {
      overall: overallRisk,
      factors,
      recommendations: this.generateRiskRecommendations(factors, overallRisk)
    };
  }

  private calculateOverallRisk(factors: Array<{ risk: 'Low' | 'Medium' | 'High' }>): 'Low' | 'Medium' | 'High' | 'Critical' {
    const highRisks = factors.filter(f => f.risk === 'High').length;
    const mediumRisks = factors.filter(f => f.risk === 'Medium').length;
    
    if (highRisks >= 3) return 'Critical';
    if (highRisks >= 1 || mediumRisks >= 3) return 'High';
    if (mediumRisks >= 1) return 'Medium';
    return 'Low';
  }

  private generateRiskRecommendations(
    factors: Array<{ type: string; risk: 'Low' | 'Medium' | 'High'; description: string }>,
    overallRisk: 'Low' | 'Medium' | 'High' | 'Critical'
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallRisk === 'Critical' || overallRisk === 'High') {
      recommendations.push('Consider reducing position sizes');
      recommendations.push('Implement stop-loss mechanisms');
    }
    
    if (factors.some(f => f.type === 'Token Volatility')) {
      recommendations.push('Monitor token prices closely');
    }
    
    if (factors.some(f => f.type === 'DeFi Protocol')) {
      recommendations.push('Verify smart contract audits');
      recommendations.push('Consider protocol insurance');
    }
    
    recommendations.push('Diversify across different protocols and tokens');
    
    return recommendations;
  }

  private async analyzeMarketImpact(tokenPrices: TokenPriceInfo[], totalUSDValue: number): Promise<AdvancedTransactionAnalysis['marketImpact']> {
    // Calculate potential market impact based on transaction size
    const priceMovement = this.calculatePriceMovement(totalUSDValue);
    const volumeSignificance = this.assessVolumeSignificance(totalUSDValue, tokenPrices);
    
    return {
      priceMovement,
      volumeSignificance,
      arbitrageOpportunities: await this.identifyArbitrageOpportunities(tokenPrices)
    };
  }

  private calculatePriceMovement(totalUSDValue: number): number {
    // Mock calculation - in reality would depend on liquidity depth
    if (totalUSDValue > 1000000) return 0.5; // 0.5% for large transactions
    if (totalUSDValue > 100000) return 0.1;  // 0.1% for medium transactions
    return 0.01; // 0.01% for small transactions
  }

  private assessVolumeSignificance(totalUSDValue: number, tokenPrices: TokenPriceInfo[]): 'Negligible' | 'Minor' | 'Moderate' | 'Significant' {
    const avgVolume = tokenPrices.reduce((sum, tp) => sum + (tp.priceData?.volume24h || 0), 0) / tokenPrices.length;
    const volumeRatio = totalUSDValue / avgVolume;
    
    if (volumeRatio > 0.1) return 'Significant';
    if (volumeRatio > 0.01) return 'Moderate';
    if (volumeRatio > 0.001) return 'Minor';
    return 'Negligible';
  }

  private async identifyArbitrageOpportunities(tokenPrices: TokenPriceInfo[]): Promise<Array<{ protocol: string; potential: number; risk: string }>> {
    // Mock arbitrage detection - in reality would compare prices across DEXes
    return [
      {
        protocol: 'Cross-DEX Arbitrage',
        potential: Math.random() * 0.5, // 0-0.5% potential
        risk: 'MEV competition and slippage'
      }
    ];
  }

  private async calculateFeeInUSD(gasData: any): Promise<number> {
    const xtzPrice = await this.getTokenPrice('AVAX', 'native');
    if (!xtzPrice) return 0;
    
    const feeInAVAX = Number(gasData.actualFee || 0) / 1e18;
    return feeInAVAX * xtzPrice.priceUSD;
  }

  private getDefaultGasAnalysis(): GasPriceAnalysis {
    return {
      currentGasPrice: 0n,
      averageGasPrice: 0n,
      optimalGasPrice: 0n,
      networkCongestion: 'Medium',
      recommendations: {
        timing: 'Unable to analyze network conditions',
        optimization: ['Monitor gas prices before transacting'],
        costSaving: 0
      },
      historicalTrends: {
        last1h: 0,
        last24h: 0,
        last7d: 0
      }
    };
  }
}