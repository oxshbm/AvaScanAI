import React from 'react';
import { Activity, Zap, DollarSign, BarChart3, TrendingUp, Clock } from 'lucide-react';

interface StatsOverviewProps {
  latestBlock: number;
  pendingTxns: number;
  totalVolume24h?: number;
  avgGasEfficiency?: number;
}

const StatsOverview: React.FC<StatsOverviewProps> = ({ 
  latestBlock, 
  pendingTxns,
  totalVolume24h = 1234567,
  avgGasEfficiency = 87
}) => {
  const stats = [
    {
      icon: <Activity className="w-5 h-5" />,
      label: 'Latest Block',
      value: latestBlock.toLocaleString(),
      color: 'purple',
      subtext: 'Avalanche Mainnet'
    },
    {
      icon: <Clock className="w-5 h-5" />,
      label: 'Pending Txns',
      value: pendingTxns.toString(),
      color: 'red',
      subtext: 'In mempool'
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: '24h Volume',
      value: `$${(totalVolume24h / 1000000).toFixed(2)}M`,
      color: 'green',
      subtext: 'Pragma tracked'
    },
    {
      icon: <Zap className="w-5 h-5" />,
      label: 'Avg Gas Efficiency',
      value: `${avgGasEfficiency}%`,
      color: 'yellow',
      subtext: 'Last 100 txns'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[color as keyof typeof colors] || colors.purple;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
                  {stat.icon}
                </div>
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.subtext}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsOverview;