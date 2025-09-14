// utils/messageFormatter.ts
import { extractComplexityBadge, extractRiskBadge, formatPriceFeeds, formatDeFiInsights } from './formatUtils';

export const formatList = (content: string): string => {
  if (!content) return '';
  
  // Handle subsections within the content
  const processedContent = content.replace(/---Sub Section---/g, '\n<h4 class="text-sm font-semibold text-gray-800 mt-4 mb-2 border-b border-gray-200 pb-1">');
  
  return processedContent.split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      // Handle subsection headers
      if (item.startsWith('<h4 class="text-sm font-semibold')) {
        return item + '</h4>';
      }
      
      // Clean up the item
      let formattedItem = item.replace(/^-\s*/, '');
      
      // Handle bold formatting
      formattedItem = formattedItem.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
      
      // Handle different types of content
      if (formattedItem.toLowerCase().includes('warning') || formattedItem.toLowerCase().includes('risk')) {
        return `<div class="bg-red-50 text-red-700 p-3 rounded-lg my-2 border border-red-200 text-sm">${formattedItem}</div>`;
      }
      if (formattedItem.toLowerCase().includes('success') || formattedItem.toLowerCase().includes('optimal')) {
        return `<div class="bg-green-50 text-green-700 p-3 rounded-lg my-2 border border-green-200 text-sm">${formattedItem}</div>`;
      }
      if (formattedItem.toLowerCase().includes('opportunity') || formattedItem.toLowerCase().includes('insight')) {
        return `<div class="bg-blue-50 text-blue-700 p-3 rounded-lg my-2 border border-blue-200 text-sm">${formattedItem}</div>`;
      }
      
      // Handle key-value pairs
      if (formattedItem.includes(':') && !formattedItem.includes('http')) {
        const parts = formattedItem.split(':');
        if (parts.length === 2) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          return `<div class="flex items-start py-1.5 border-b border-gray-100 last:border-0">
            <span class="text-gray-600 font-medium min-w-[120px] text-sm">${key}:</span>
            <span class="text-gray-900 ml-2 text-sm">${value}</span>
          </div>`;
        }
      }
      
      return `<div class="text-gray-700 p-2 my-1 text-sm leading-relaxed">${formattedItem}</div>`;
    })
    .join('');
};

const formatTokenTransfers = (content: string): string => {
  if (!content) return '';
  
  const transfers = content.split('\n\n').map(group => group.trim()).filter(group => group);
  
  return transfers.map(transfer => {
    const lines = transfer.split('\n')
      .map(line => line.trim())
      .filter(line => line);
    
    return `
      <div class="bg-gray-50 border border-gray-200 p-4 mb-3 rounded-lg">
        ${lines.map(line => {
          const [key, value] = line.split(':').map(part => part.trim());
          if (!value) {
            return `<div class="text-gray-700 py-1">${key}</div>`;
          }
          return `
            <div class="flex items-start py-1.5 border-b border-gray-100 last:border-0">
              <span class="text-gray-500 font-medium min-w-[100px]">${key}:</span>
              <span class="text-gray-900 ml-2">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');
};

export const formatTransferSection = (content: string): string => {
  if (!content) return '<div class="text-gray-500 text-center italic p-4">No transfers detected</div>';
  
  const parts = content.split('---Sub Section---');
  let html = '';
  
  parts.forEach(part => {
    const trimmedPart = part.trim();
    
    if (trimmedPart.includes('Native Currency:')) {
      html += `<div class="bg-purple-50 border-l-4 border-purple-700 p-4 mb-4 rounded-r-lg">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">💰</span>
          <span>Native Currency Transfer</span>
        </h4>
        ${formatList(trimmedPart.replace('Native Currency:', '').trim())}
      </div>`;
    }
    else if (trimmedPart.includes('Token Transfers (ERC20):')) {
      html += `<div class="bg-red-50 border-l-4 border-red-700 p-4 mb-4 rounded-r-lg">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">🪙</span>
          <span>Token Transfers</span>
        </h4>
        ${formatTokenTransfers(trimmedPart.replace('Token Transfers (ERC20):', '').trim())}
      </div>`;
    }
    else if (trimmedPart.includes('NFT Transfers')) {
      html += `<div class="bg-purple-50 border-l-4 border-purple-700 p-4 mb-4 rounded-r-lg">
        <h4 class="flex items-center text-base font-medium text-gray-900 mb-3">
          <span class="mr-2">🖼️</span>
          <span>NFT Transfers</span>
        </h4>
        ${formatTokenTransfers(trimmedPart.replace('NFT Transfers (ERC721/ERC1155):', '').trim())}
      </div>`;
    }
  });
  
  return html || '<div class="text-gray-500 text-center italic p-4">No transfers detected</div>';
};

export const formatAssistantMessage = (content: string): string => {
  if (!content) return '';
  
  const sections = content.split('---Section---');
  let formattedContent = '';
  
  sections.forEach(section => {
    const trimmedSection = section.trim();
    
    if (trimmedSection.includes('📊 EXECUTIVE SUMMARY:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-blue-100 rounded-lg">📊</span>
          <span>Executive Summary</span>
        </h3>
        ${formatList(trimmedSection.replace('📊 EXECUTIVE SUMMARY:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('💰 USD VALUE ANALYSIS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-green-100 rounded-lg">💰</span>
          <span>USD Value Analysis</span>
        </h3>
        ${formatList(trimmedSection.replace('💰 USD VALUE ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('🏦 DEFI PROTOCOL INTELLIGENCE:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-purple-100 rounded-lg">🏦</span>
          <span>DeFi Protocol Intelligence</span>
        </h3>
        ${formatList(trimmedSection.replace('🏦 DEFI PROTOCOL INTELLIGENCE:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('⚠️ COMPREHENSIVE RISK ASSESSMENT:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-red-100 rounded-lg">⚠️</span>
          <span>Comprehensive Risk Assessment</span>
        </h3>
        ${formatList(trimmedSection.replace('⚠️ COMPREHENSIVE RISK ASSESSMENT:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('📊 MARKET INTELLIGENCE:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-indigo-100 rounded-lg">📊</span>
          <span>Market Intelligence</span>
        </h3>
        ${formatList(trimmedSection.replace('📊 MARKET INTELLIGENCE:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('💡 PROFIT & LOSS ANALYSIS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-yellow-100 rounded-lg">💡</span>
          <span>Profit & Loss Analysis</span>
        </h3>
        ${formatList(trimmedSection.replace('💡 PROFIT & LOSS ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('🎯 ACTIONABLE INTELLIGENCE:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-orange-100 rounded-lg">🎯</span>
          <span>Actionable Intelligence</span>
        </h3>
        ${formatList(trimmedSection.replace('🎯 ACTIONABLE INTELLIGENCE:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('🌐 ETHERLINK NETWORK INTELLIGENCE:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-teal-100 rounded-lg">🌐</span>
          <span>AVALANCHE NETWORK INTELLIGENCE</span>
        </h3>
        ${formatList(trimmedSection.replace('🌐 ETHERLINK NETWORK INTELLIGENCE:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('📞 EXECUTIVE SUMMARY FOR DECISION MAKING:')) {
      formattedContent += `<div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-blue-100 rounded-lg">📞</span>
          <span>Executive Summary for Decision Making</span>
        </h3>
        ${formatList(trimmedSection.replace('📞 EXECUTIVE SUMMARY FOR DECISION MAKING:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('TRANSACTION OVERVIEW:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-purple-100 rounded-lg">
            <svg class="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 010 14z"></path>
            </svg>
          </span>
          <span>Transaction Overview</span>
          ${extractComplexityBadge(trimmedSection)}
        </h3>
        ${formatList(trimmedSection.replace('TRANSACTION OVERVIEW:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('NETWORK DETAILS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-red-100 rounded-lg">
            <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
          </span>
          <span>Network Details</span>
        </h3>
        ${formatList(trimmedSection.replace('NETWORK DETAILS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('TRANSFER ANALYSIS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-purple-100 rounded-lg">
            <svg class="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
            </svg>
          </span>
          <span>Transfer Analysis</span>
        </h3>
        ${formatTransferSection(trimmedSection.replace('TRANSFER ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('CONTRACT INTERACTIONS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-red-100 rounded-lg">
            <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </span>
          <span>Contract Interactions</span>
        </h3>
        ${formatList(trimmedSection.replace('CONTRACT INTERACTIONS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('COST ANALYSIS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-purple-100 rounded-lg">
            <svg class="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          <span>Cost Analysis</span>
        </h3>
        ${formatList(trimmedSection.replace('COST ANALYSIS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('SECURITY ASSESSMENT:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-red-100 rounded-lg">
            <svg class="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
            </svg>
          </span>
          <span>Security Assessment</span>
          ${extractRiskBadge(trimmedSection)}
        </h3>
        ${formatList(trimmedSection.replace('SECURITY ASSESSMENT:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('PRICE FEEDS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-green-100 rounded-lg">
            <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </span>
          <span>Price Feeds</span>
          <span class="ml-auto px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Live Data</span>
        </h3>
        ${formatPriceFeeds(trimmedSection.replace('PRICE FEEDS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('DEFI INSIGHTS:')) {
      formattedContent += `<div class="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-white rounded-lg shadow-sm">
            <svg class="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </span>
          <span>DeFi Insights</span>
          <span class="ml-2 text-sm text-green-600">(AI-Powered)</span>
        </h3>
        ${formatDeFiInsights(trimmedSection.replace('DEFI INSIGHTS:', '').trim())}
      </div>`;
    }
    else if (trimmedSection.includes('ADDITIONAL INSIGHTS:')) {
      formattedContent += `<div class="bg-white border border-gray-200 rounded-xl p-6 mb-4 shadow-sm">
        <h3 class="flex items-center text-lg font-semibold text-gray-900 mb-4">
          <span class="mr-3 p-2 bg-gray-100 rounded-lg">
            <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </span>
          <span>Additional Insights</span>
        </h3>
        ${formatList(trimmedSection.replace('ADDITIONAL INSIGHTS:', '').trim())}
      </div>`;
    }
  });
  
  return formattedContent || `<div class="text-gray-700 whitespace-pre-wrap">${content}</div>`;
};
