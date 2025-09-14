
export const extractComplexityBadge = (content: string): string => {
  if (content.includes('Complexity: High')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High Complexity</span>`;
  }
  if (content.includes('Complexity: Medium')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium Complexity</span>`;
  }
  if (content.includes('Complexity: Low')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low Complexity</span>`;
  }
  return '';
};

export const extractRiskBadge = (content: string): string => {
  if (content.includes('Risk: High')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High Risk</span>`;
  }
  if (content.includes('Risk: Medium')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium Risk</span>`;
  }
  if (content.includes('Risk: Low')) {
    return `<span class="ml-auto px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low Risk</span>`;
  }
  return '';
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  const trimmedAddress = address.startsWith('0x') ? address.substring(2) : address;
  if (trimmedAddress.length <= 10) return address;
  return `0x${trimmedAddress.substring(0, 6)}...${trimmedAddress.substring(trimmedAddress.length - 4)}`;
};

export const formatPriceFeeds = (content: string): string => {
  if (!content) return '';
  
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  return lines.map(line => {
    if (line.includes('Price:')) {
      return `<div class="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-200 my-1">
        <span class="text-gray-700">${line}</span>
        <span class="text-xs text-green-600 font-medium">Live Price</span>
      </div>`;
    }
    return `<div class="text-gray-700 py-1">${line}</div>`;
  }).join('');
};

export const formatDeFiInsights = (content: string): string => {
  if (!content) return '';
  
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  return lines.map(line => {
    if (line.includes(')')) { // Assuming the user meant to check for a closing parenthesis
      return `<div class="flex items-center gap-2 py-2">
        <span class="text-green-600">💰</span>
        <span class="text-gray-900 font-medium">${line}</span>
      </div>`;
    }
    if (line.includes('⚡')) {
      return `<div class="bg-yellow-50 text-yellow-800 p-3 rounded-lg my-2 border border-yellow-200">${line}</div>`;
    }
    if (line.includes('⚠️')) {
      return `<div class="bg-red-50 text-red-700 p-3 rounded-lg my-2 border border-red-200">${line}</div>`;
    }
    return `<div class="text-gray-700 py-1">${line}</div>`;
  }).join('');
};

// Additional formatting utilities
export function formatBlockNumber(blockNumber: string | number): string {
  const num = typeof blockNumber === 'string' ? parseInt(blockNumber) : blockNumber;
  return num.toLocaleString();
}

export function formatBalance(balance: string, decimals: number = 18): string {
  const balanceNum = Number(balance) / Math.pow(10, decimals);
  if (balanceNum === 0) return '0';
  if (balanceNum < 0.0001) return '< 0.0001';
  if (balanceNum < 1) return balanceNum.toFixed(6);
  if (balanceNum < 1000) return balanceNum.toFixed(4);
  if (balanceNum < 1000000) return `${(balanceNum / 1000).toFixed(2)}K`;
  return `${(balanceNum / 1000000).toFixed(2)}M`;
}

export function formatUSD(amount: number): string {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return '< $0.01';
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  if (amount < 1000000) return `$${(amount / 1000).toFixed(1)}K`;
  if (amount < 1000000000) return `$${(amount / 1000000).toFixed(1)}M`;
  return `$${(amount / 1000000000).toFixed(1)}B`;
}

export function formatGas(gasAmount: string | number): string {
  const num = typeof gasAmount === 'string' ? parseInt(gasAmount) : gasAmount;
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  return `${(num / 1000000).toFixed(1)}M`;
}

export function formatTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatTransactionType(type: number): string {
  switch (type) {
    case 0: return 'Legacy';
    case 1: return 'EIP-2930';
    case 2: return 'EIP-1559';
    default: return `Type ${type}`;
  }
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'critical': return 'text-red-800 bg-red-100 border-red-300';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getActivityColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'low': return 'text-gray-600 bg-gray-50';
    case 'medium': return 'text-blue-600 bg-blue-50';
    case 'high': return 'text-purple-600 bg-purple-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}
