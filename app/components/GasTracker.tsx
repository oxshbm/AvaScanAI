// app/components/GasTracker.tsx
import React, { useEffect, useState } from 'react';
import { Fuel, TrendingUp, TrendingDown, Activity, Clock, Zap, AlertCircle, RefreshCw, Target, DollarSign, BarChart3, Lightbulb } from 'lucide-react';
import { JsonRpcProvider } from 'ethers';

interface GasData {
  gasPrice: number;
  formattedGasPrice: string;
  gasPriceGwei: number;
  lastUpdated: Date;
  isLoading?: boolean;
  error?: string;
  optimization?: {
    currentLevel: 'Optimal' | 'Good' | 'High';
    suggestion: string;
    optimalTiming: string;
  };
}

interface NetworkStats {
  blockNumber: number;
  blockTime: number;
  transactionCount: number;
  gasUsed: number;
  gasLimit: number;
  utilization: number;
}

const GasTracker = () => {
  const [gasData, setGasData] = useState<GasData | null>(null);
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  const fetchGasData = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Initialize Avalanche provider
      const provider = new JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc');
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const latestBlock = await provider.getBlock('latest');
      
      if (feeData.gasPrice && latestBlock) {
        const gasPriceWei = Number(feeData.gasPrice);
        const gasPriceGwei = gasPriceWei / 1e9;
        
        // Generate real optimization insights based on current conditions
        const optimization = generateOptimizationInsights(gasPriceGwei);
        
        const gasInfo: GasData = {
          gasPrice: gasPriceWei,
          formattedGasPrice: `${gasPriceGwei.toFixed(2)} Gwei`,
          gasPriceGwei,
          lastUpdated: new Date(),
          isLoading: false,
          optimization
        };
        
        setGasData(gasInfo);
        
        // Get network stats
        const networkInfo: NetworkStats = {
          blockNumber: latestBlock.number,
          blockTime: latestBlock.timestamp,
          transactionCount: latestBlock.transactions.length,
          gasUsed: Number(latestBlock.gasUsed),
          gasLimit: Number(latestBlock.gasLimit),
          utilization: (Number(latestBlock.gasUsed) / Number(latestBlock.gasLimit)) * 100
        };
        
        setNetworkStats(networkInfo);
        setIsHealthy(true);
      } else {
        throw new Error('Unable to fetch gas data');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to fetch gas data:', error);
      setIsHealthy(false);
      setGasData({
        gasPrice: 0,
        formattedGasPrice: 'N/A',
        gasPriceGwei: 0,
        lastUpdated: new Date(),
        isLoading: false,
        error: 'Failed to fetch gas data'
      });
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGasData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchGasData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const getGasSpeedCategory = (gwei: number) => {
    if (gwei < 1) return { label: 'Slow', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (gwei < 5) return { label: 'Standard', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    if (gwei < 20) return { label: 'Fast', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { label: 'Rapid', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const generateOptimizationInsights = (gasPriceGwei: number): GasData['optimization'] => {
    // Avalanche typically has very low gas prices (< 30 nAVAX base fee)
    if (gasPriceGwei < 30) {
      return {
        currentLevel: 'Optimal',
        suggestion: 'Excellent conditions - typical Avalanche low fees',
        optimalTiming: 'Now'
      };
    } else if (gasPriceGwei < 100) {
      return {
        currentLevel: 'Good',
        suggestion: 'Reasonable fees - good time to transact',
        optimalTiming: 'Current conditions favorable'
      };
    } else {
      return {
        currentLevel: 'High',
        suggestion: 'Higher than usual - network experiencing congestion',
        optimalTiming: 'Monitor for lower fees'
      };
    }
  };


  if (isLoading && !gasData) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-600">Loading network data...</p>
          </div>
        </div>
      </div>
    );
  }

  const gasCategory = gasData ? getGasSpeedCategory(gasData.gasPriceGwei) : { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-50' };

  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-50 p-4 border-b border-red-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Fuel className="w-5 h-5 text-blue-600" />
            Avalanche Gas Tracker
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-xs text-gray-600">
                {isHealthy ? 'Network Online' : 'Network Issues'}
              </span>
            </div>
            <button
              onClick={fetchGasData}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-white rounded-md transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Gas Price Section */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Current Gas Price */}
          <div className={`${gasCategory.bgColor} rounded-lg p-4 hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${gasCategory.color}`} />
                <span className="text-sm font-medium text-gray-700">Current Gas Price</span>
              </div>
            </div>
            
            <div className="mb-2">
              {gasData?.error ? (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Error</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {gasData?.formattedGasPrice || 'Loading...'}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${gasCategory.bgColor} ${gasCategory.color} border`}>
                {gasCategory.label}
              </span>
              <span className="text-xs text-gray-500">
                Simple transfer: ~{((gasData?.gasPriceGwei || 0) * 21000 / 1e9).toFixed(6)} AVAX
              </span>
            </div>
          </div>

          {/* Network Activity */}
          <div className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Network Activity</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Block Number:</span>
                <span className="font-medium">{networkStats?.blockNumber.toLocaleString() || 'Loading...'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Transactions:</span>
                <span className="font-medium">{networkStats?.transactionCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Gas Utilization:</span>
                <span className="font-medium">{networkStats?.utilization.toFixed(1) || 0}%</span>
              </div>
              {networkStats?.utilization && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(networkStats.utilization, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Optimization Insights */}
        {gasData?.optimization && (
          <div className="border-t border-red-200 pt-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              <h3 className="text-sm font-medium text-gray-700">AI Optimization Insights</h3>
            </div>
            
            <div className={`rounded-lg p-4 ${
              gasData.optimization.currentLevel === 'Optimal' ? 'bg-green-50 border border-green-200' :
              gasData.optimization.currentLevel === 'Good' ? 'bg-blue-50 border border-blue-200' :
              gasData.optimization.currentLevel === 'High' ? 'bg-orange-50 border border-orange-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    gasData.optimization.currentLevel === 'Optimal' ? 'bg-green-100 text-green-800' :
                    gasData.optimization.currentLevel === 'Good' ? 'bg-blue-100 text-blue-800' :
                    gasData.optimization.currentLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <Target className="w-3 h-3 mr-1" />
                    {gasData.optimization.currentLevel} Conditions
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-600">Optimal timing</div>
                  <div className="text-sm font-medium">{gasData.optimization.optimalTiming}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{gasData.optimization.suggestion}</p>
            </div>
          </div>
        )}


        {/* Enhanced Gas Calculator */}
        <div className="border-t border-red-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-medium text-gray-700">Gas Cost Calculator</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Simple Transfer', gas: 21000, icon: '💸' },
              { label: 'Token Transfer', gas: 65000, icon: '🪙' },
              { label: 'DEX Swap', gas: 150000, icon: '🔄' },
              { label: 'DeFi Interaction', gas: 300000, icon: '🏦' }
            ].map((item, index) => (
              <div key={index} className="text-center p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all">
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                <div className="font-semibold text-gray-900">
                  {gasData ? `${(gasData.gasPriceGwei * item.gas / 1e9).toFixed(6)} AVAX` : 'Loading...'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Last update: {gasData?.lastUpdated.toLocaleTimeString() || 'Never'}</span>
          </div>
          <div className="text-xs text-gray-500">
            Powered by Avalanche Network
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasTracker;