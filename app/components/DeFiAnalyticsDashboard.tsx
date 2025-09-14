// app/components/DeFiAnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Shield, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Eye,
  RefreshCw
} from 'lucide-react';

interface DeFiProtocol {
  name: string;
  type: 'DEX' | 'Lending' | 'Yield Farming' | 'Bridge';
  tvl: number;
  volume24h: number;
  apr: number;
  riskScore: number;
  fees: number;
  users24h: number;
  change24h: number;
  verified: boolean;
}

interface MarketOpportunity {
  type: 'Arbitrage' | 'Yield' | 'Liquidity';
  protocol: string;
  expectedReturn: number;
  risk: 'Low' | 'Medium' | 'High';
  timeframe: string;
  description: string;
  requirements: string[];
}

interface SecurityAlert {
  level: 'Info' | 'Warning' | 'Critical';
  protocol: string;
  message: string;
  action: string;
  timestamp: Date;
}

const DeFiAnalyticsDashboard = () => {
  const [protocols, setProtocols] = useState<DeFiProtocol[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'DEX' | 'Lending' | 'Yield Farming' | 'Bridge'>('all');

  useEffect(() => {
    generateMockData();
  }, []);

  const generateMockData = () => {
    // Generate mock DeFi protocols data
    const mockProtocols: DeFiProtocol[] = [
      {
        name: 'AvalancheSwap',
        type: 'DEX',
        tvl: 12500000,
        volume24h: 2800000,
        apr: 8.5,
        riskScore: 25,
        fees: 0.3,
        users24h: 1240,
        change24h: 12.3,
        verified: true
      },
      {
        name: 'AVAX Lend',
        type: 'Lending',
        tvl: 8200000,
        volume24h: 950000,
        apr: 12.8,
        riskScore: 35,
        fees: 0.1,
        users24h: 680,
        change24h: -3.2,
        verified: true
      },
      {
        name: 'Avalanche Farms',
        type: 'Yield Farming',
        tvl: 5600000,
        volume24h: 420000,
        apr: 45.2,
        riskScore: 55,
        fees: 2.0,
        users24h: 320,
        change24h: 8.7,
        verified: false
      },
      {
        name: 'L1-L2 Bridge',
        type: 'Bridge',
        tvl: 18300000,
        volume24h: 1200000,
        apr: 0,
        riskScore: 20,
        fees: 0.05,
        users24h: 890,
        change24h: 5.1,
        verified: true
      }
    ];

    // Generate mock opportunities
    const mockOpportunities: MarketOpportunity[] = [
      {
        type: 'Arbitrage',
        protocol: 'AvalancheSwap → AVAX Lend',
        expectedReturn: 3.2,
        risk: 'Medium',
        timeframe: '2-4 hours',
        description: 'Price discrepancy between USDC pools',
        requirements: ['$10k+ capital', 'Gas optimization']
      },
      {
        type: 'Yield',
        protocol: 'Avalanche Farms',
        expectedReturn: 45.2,
        risk: 'High',
        timeframe: '30+ days',
        description: 'High APR staking opportunity',
        requirements: ['Risk tolerance', 'Impermanent loss awareness']
      },
      {
        type: 'Liquidity',
        protocol: 'AvalancheSwap',
        expectedReturn: 12.8,
        risk: 'Low',
        timeframe: '7+ days',
        description: 'Stable LP rewards with low IL risk',
        requirements: ['Paired tokens', 'Long-term commitment']
      }
    ];

    // Generate mock security alerts
    const mockAlerts: SecurityAlert[] = [
      {
        level: 'Warning',
        protocol: 'Avalanche Farms',
        message: 'Unverified smart contract detected',
        action: 'Review audit status before large deposits',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        level: 'Info',
        protocol: 'L1-L2 Bridge',
        message: 'High volume detected - potential congestion',
        action: 'Monitor transaction times',
        timestamp: new Date(Date.now() - 1800000)
      }
    ];

    setProtocols(mockProtocols);
    setOpportunities(mockOpportunities);
    setAlerts(mockAlerts);
    setIsLoading(false);
  };

  const filteredProtocols = selectedCategory === 'all' 
    ? protocols 
    : protocols.filter(p => p.type === selectedCategory);

  const totalTVL = protocols.reduce((sum, p) => sum + p.tvl, 0);
  const total24hVolume = protocols.reduce((sum, p) => sum + p.volume24h, 0);
  const avgAPR = protocols.reduce((sum, p) => sum + p.apr, 0) / protocols.length;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading DeFi analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            DeFi Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time insights and opportunities across Avalanche DeFi protocols
          </p>
        </div>

        {/* Summary Stats */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalTVL)}</div>
              <div className="text-sm text-gray-600">Total TVL</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(total24hVolume)}</div>
              <div className="text-sm text-gray-600">24h Volume</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Percent className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{avgAPR.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Avg APR</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Target className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{opportunities.length}</div>
              <div className="text-sm text-gray-600">Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security Alerts</h3>
          </div>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                alert.level === 'Critical' ? 'bg-red-50 border-red-200' :
                alert.level === 'Warning' ? 'bg-yellow-50 border-yellow-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {alert.level === 'Critical' ? 
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" /> :
                      alert.level === 'Warning' ?
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" /> :
                      <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                    }
                    <div>
                      <div className="font-medium text-gray-900">{alert.protocol}</div>
                      <div className="text-sm text-gray-700">{alert.message}</div>
                      <div className="text-xs text-gray-600 mt-1">Action: {alert.action}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Opportunities */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">Market Opportunities</h3>
        </div>
        <div className="grid gap-4">
          {opportunities.map((opportunity, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opportunity.type === 'Arbitrage' ? 'bg-green-100 text-green-800' :
                      opportunity.type === 'Yield' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {opportunity.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      opportunity.risk === 'Low' ? 'bg-green-100 text-green-800' :
                      opportunity.risk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {opportunity.risk} Risk
                    </span>
                  </div>
                  <div className="font-medium text-gray-900">{opportunity.protocol}</div>
                  <div className="text-sm text-gray-600">{opportunity.description}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {opportunity.expectedReturn.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">{opportunity.timeframe}</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <strong>Requirements:</strong> {opportunity.requirements.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol Analysis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Protocol Analysis</h3>
            <div className="flex gap-2">
              {(['all', 'DEX', 'Lending', 'Yield Farming', 'Bridge'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {filteredProtocols.map((protocol, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {protocol.name.split(' ').map(w => w[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{protocol.name}</span>
                        {protocol.verified && <CheckCircle className="w-4 h-4 text-green-600" />}
                      </div>
                      <span className="text-xs text-gray-600">{protocol.type}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    protocol.change24h >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {protocol.change24h >= 0 ? 
                      <TrendingUp className="w-4 h-4" /> : 
                      <TrendingDown className="w-4 h-4" />
                    }
                    {Math.abs(protocol.change24h).toFixed(1)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">TVL</div>
                    <div className="font-semibold">{formatCurrency(protocol.tvl)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">24h Volume</div>
                    <div className="font-semibold">{formatCurrency(protocol.volume24h)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">APR</div>
                    <div className="font-semibold text-green-600">{protocol.apr.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Risk Score</div>
                    <div className={`font-semibold ${
                      protocol.riskScore < 30 ? 'text-green-600' :
                      protocol.riskScore < 60 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {protocol.riskScore}/100
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">24h Users</div>
                    <div className="font-semibold">{protocol.users24h.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Protocol Fee: {protocol.fees}%</span>
                    <span className={`px-2 py-1 rounded-full ${
                      protocol.riskScore < 30 ? 'bg-green-100 text-green-800' :
                      protocol.riskScore < 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {protocol.riskScore < 30 ? 'Low Risk' :
                       protocol.riskScore < 60 ? 'Medium Risk' : 'High Risk'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeFiAnalyticsDashboard;