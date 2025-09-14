'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useChat, type Message } from 'ai/react';
import { JsonRpcProvider } from 'ethers';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  AlertTriangle, 
  ArrowRight, 
  Blocks,
  Hash,
  ChevronRight,
  Maximize2,
  ArrowLeft,
  X,
  DollarSign,
  Filter,
  Eye,
  Sparkles,
  TrendingUp,
  Activity,
  Clock,
  Wallet,
  ArrowUpRight,
  Fuel
} from 'lucide-react';
import { formatAssistantMessage } from '../utils/messageFormatter';
import { formatAddress, formatGas } from '../utils/formatUtils';
import { validateAndDetectInput, formatInputForDisplay, getInputTypeDescription } from '../utils/inputValidator';
import MermaidDiagram from './MermaidDiagram';
import DiagramModal from './DiagramModal';
import StatsOverview from './StatsOverview';
import GasTracker from './GasTracker';

// Configure Avalanche provider with multiple endpoints for reliability
const RPC_ENDPOINTS = [
  'https://api.avax.network/ext/bc/C/rpc',
  'https://avalanche-c-chain.publicnode.com',
  'https://rpc.ankr.com/avalanche'
];

let provider: JsonRpcProvider;

// Initialize provider with fallback
const initializeProvider = () => {
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      provider = new JsonRpcProvider(endpoint);
      console.log(`Using RPC endpoint: ${endpoint}`);
      break;
    } catch (error) {
      console.warn(`Failed to initialize provider with ${endpoint}:`, error);
    }
  }
  
  if (!provider) {
    provider = new JsonRpcProvider(RPC_ENDPOINTS[0]);
  }
};

initializeProvider();

interface AvalancheBlock {
  hash: string;
  number: number;
  timestamp: number;
  transaction_count: number;
  parent_hash: string;
  gasUsed: string;
  gasLimit: string;
}

interface AvalancheTransaction {
  hash: string;
  type: number;
  from: string;
  to: string | null;
  value: string;
  gasLimit: string;
  gasPrice: string;
  nonce: number;
  data: string;
}

const BlockchainExplorer: React.FC = () => {
  const [latestBlocks, setLatestBlocks] = useState<AvalancheBlock[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<AvalancheTransaction[]>([]);
  const [networkStats, setNetworkStats] = useState({
    latestBlock: 0,
    chainId: '',
    pendingTxns: 0,
  });
  const [isLoadingChainData, setIsLoadingChainData] = useState(true);
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [mermaidChart, setMermaidChart] = useState<string | null>(null);
  const [inputValidation, setInputValidation] = useState<ReturnType<typeof validateAndDetectInput> | null>(null);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Block modal states
  const [selectedBlock, setSelectedBlock] = useState<AvalancheBlock | null>(null);
  const [blockTransactions, setBlockTransactions] = useState<string[]>([]);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, input, handleInputChange, handleSubmit: chatHandleSubmit, isLoading, error, reload, stop, setInput } = useChat({
    api: '/api/chat',
    id: selectedTxHash || undefined,
    body: {
      txHash: selectedTxHash,
      chainId: 43114
    },
    onFinish: (message: Message) => {
      const mermaidMatch = message.content.match(/```mermaid\n([\s\S]*?)\n```/);
      
      if (mermaidMatch) {
        const diagram = mermaidMatch[1].trim();
        setMermaidChart(diagram);
        setCurrentMessage(message.content.replace(/```mermaid\n[\s\S]*?\n```/, '').trim());
      } else {
        setCurrentMessage(message.content);
        setMermaidChart(null);
      }

      const analysisSection = document.getElementById('analysis-section');
      if (analysisSection) {
        analysisSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Fetch latest blocks and transactions
  const fetchBlockchainData = async () => {
    try {
      setIsLoadingChainData(true);
      setIsRefreshing(true);
      
      console.log('Fetching blockchain data from Avalanche C-Chain...');
      
      // Get latest block number first
      const latestBlockNumber = await provider.getBlockNumber();
      console.log('Latest block number:', latestBlockNumber);
      
      // Get network info
      const network = await provider.getNetwork();
      console.log('Network:', network.chainId);
      
      // Fetch latest blocks (last 10 blocks)
      const blocks: AvalancheBlock[] = [];
      const blockFetchPromises = [];
      
      for (let i = 0; i < 20; i++) {
        const blockNumber = latestBlockNumber - i;
        blockFetchPromises.push(
          provider.getBlock(blockNumber, false).then(block => {
            if (block) {
              return {
                hash: block.hash,
                number: block.number,
                timestamp: block.timestamp,
                transaction_count: block.transactions.length,
                parent_hash: block.parentHash,
                gasUsed: block.gasUsed.toString(),
                gasLimit: block.gasLimit.toString()
              };
            }
            return null;
          }).catch(err => {
            console.error(`Error fetching block ${blockNumber}:`, err);
            return null;
          })
        );
      }
      
      const blockResults = await Promise.all(blockFetchPromises);
      const validBlocks = blockResults.filter(block => block !== null) as AvalancheBlock[];
      blocks.push(...validBlocks);
      
      setLatestBlocks(blocks);
      
      // Update network stats
      const latestBlock = await provider.getBlock(latestBlockNumber, false);
      setNetworkStats({
        latestBlock: latestBlockNumber,
        chainId: network.chainId.toString(),
        pendingTxns: latestBlock ? latestBlock.transactions.length : 0,
      });
      
      // Get recent transactions from the latest block
      if (latestBlock && latestBlock.transactions.length > 0) {
        const recentTxs: AvalancheTransaction[] = [];
        const txHashes = latestBlock.transactions.slice(0, 20); // Get first 20 transactions
        
        // Fetch transaction details
        const txFetchPromises = txHashes.map(async (txHash) => {
          try {
            const tx = await provider.getTransaction(txHash);
            if (tx) {
              return {
                hash: tx.hash,
                type: tx.type || 2,
                from: tx.from,
                to: tx.to || '',
                value: tx.value.toString(),
                gasLimit: tx.gasLimit.toString(),
                gasPrice: tx.gasPrice?.toString() || '0',
                nonce: tx.nonce,
                data: tx.data
              };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching transaction ${txHash}:`, err);
            return null;
          }
        });
        
        const txResults = await Promise.all(txFetchPromises);
        const validTxs = txResults.filter(tx => tx !== null) as AvalancheTransaction[];
        recentTxs.push(...validTxs);
        
        setRecentTransactions(recentTxs);
      }
      
      console.log(`Successfully fetched ${blocks.length} blocks and ${recentTransactions.length} transactions`);

    } catch (error) {
      console.error('Error fetching blockchain data:', error);
      // Try fallback provider
      if (RPC_ENDPOINTS.length > 1) {
        try {
          const fallbackProvider = new JsonRpcProvider(RPC_ENDPOINTS[1]);
          const blockNumber = await fallbackProvider.getBlockNumber();
          console.log('Fallback provider working, block number:', blockNumber);
        } catch (fallbackError) {
          console.error('Fallback provider also failed:', fallbackError);
        }
      }
    } finally {
      setIsLoadingChainData(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 15000); // Reduced frequency to avoid rate limits
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearchMode(true);
    setSelectedTxHash(input);
    setCurrentMessage(null);
    setMermaidChart(null);
    chatHandleSubmit(e);
  };

  const formRef = useRef<HTMLFormElement>(null);

  const handleSearch = (hash: string) => {
    setInput(hash);
    setIsSearchMode(true);
    setSelectedTxHash(hash);
    setCurrentMessage(null);
    setMermaidChart(null);

    requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.requestSubmit();
      }
    });
  };

  const handleBackToExplorer = () => {
    setIsSearchMode(false);
    setSelectedTxHash(null);
    setCurrentMessage(null);
    setMermaidChart(null);
  };

  const handleReload = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    reload();
  };

  const handleBlockClick = async (block: AvalancheBlock) => {
    try {
      setIsLoadingChainData(true);
      
      // Get block with transaction hashes
      const fullBlock = await provider.getBlock(block.number, false);
      
      if (fullBlock && fullBlock.transactions && fullBlock.transactions.length > 0) {
        setSelectedBlock(block);
        setBlockTransactions(fullBlock.transactions.slice(0, 50));
        setIsBlockModalOpen(true);
      } else {
        alert(`Block ${block.number} has no transactions.`);
      }
    } catch (error) {
      console.error('Error fetching block transactions:', error);
      alert(`Error loading block ${block.number}. Please try again.`);
    } finally {
      setIsLoadingChainData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
<div className="bg-white border-b border-red-200 shadow-sm">
  <div className="max-w-7xl mx-auto">
    {/* Top Header Bar - Enhanced with gradient and better spacing */}
    <div className="px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-red-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AvaScanAI</h1>
          <p className="text-gray-600 text-sm font-medium">Enterprise-grade Avalanche intelligence for developers and infrastructure teams</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-md border border-green-200">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-green-700">Live Network</span>
        </div>
        <div className="text-right">
          <div className="text-base font-bold text-gray-900 flex items-center gap-1">
            <span>#{networkStats.latestBlock.toLocaleString()}</span>
            <Blocks className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-xs text-gray-600">Latest Block</div>
        </div>
      </div>
    </div>

    {/* Search Section - Clean centered layout */}
    <div className="px-6 py-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* All indicators in one row for desktop */}
        <div className="hidden lg:flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Activity className="w-4 h-4 text-red-500" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">{recentTransactions.length}</div>
              <div className="text-xs text-gray-600">Recent Txns</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Fuel className="w-4 h-4 text-red-500" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Low</div>
              <div className="text-xs text-gray-600">Gas Fees</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Activity className="w-4 h-4 text-red-500" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">Active</div>
              <div className="text-xs text-gray-600">Network Status</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Clock className="w-4 h-4 text-red-500" />
            <div className="text-sm">
              <div className="font-semibold text-gray-900">2.1s</div>
              <div className="text-xs text-gray-600">Block Time</div>
            </div>
          </div>
        </div>

        {/* Mobile indicators */}
        <div className="lg:hidden flex items-center justify-center gap-4 mb-6">
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Activity className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-900">{recentTransactions.length} Txns</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-red-200 shadow-sm">
            <Fuel className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-gray-900">Low Gas</span>
          </div>
        </div>

        {/* Center - Search Form - Full width */}
        <div className="w-full max-w-5xl mx-auto">          
        <form ref={formRef} onSubmit={handleFormSubmit}>
          <div className="relative group">
            {/* Search Icon Container with guaranteed visibility */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <div className="bg-gray-100 rounded-full p-1.5">
                <Search className="w-4 h-4 text-gray-600" />
              </div>
            </div>
            
            <input
              value={input}
              onChange={(e) => {
                handleInputChange(e);
                const validation = validateAndDetectInput(e.target.value);
                setInputValidation(validation);
              }}
              placeholder="Enter transaction hash, block number, or address for analysis..."
              disabled={isLoading}
              className="w-full pl-14 pr-56 py-4 bg-white border-2 border-red-300 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-lg placeholder-gray-500 transition-all shadow-md"
              style={{ caretColor: 'black' }}
            />
            
            {/* Input status indicator - moved to avoid overlap */}
            <div className="absolute right-48 top-1/2 -translate-y-1/2 pointer-events-none">
              {inputValidation?.type === 'invalid' ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-xs text-red-500 font-medium">Invalid</span>
                </div>
              ) : input ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-xs text-green-600 font-medium">Valid</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-medium">Ready</span>
                </div>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={Boolean(isLoading || !input || (inputValidation && inputValidation.type === 'invalid'))}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-red-600 text-white rounded-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-red-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> 
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Input Type Description */}
        {inputValidation && inputValidation.type !== 'invalid' && inputValidation.type !== 'empty' && (
          <div className="mt-2 text-center">
            <span className="text-xs text-gray-600">
              {getInputTypeDescription(inputValidation.type)}
            </span>
          </div>
        )}
        </div>

        {/* Error Message - Enhanced styling */}
        {error && (
          <div className="mt-6 flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 text-sm font-medium">Analysis failed. Please try again.</span>
            </div>
            <button 
              onClick={handleReload}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors text-xs font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Analysis</span>
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
      {/* Main Content - Reduced padding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {isSearchMode ? (
          // Analysis Section
          <div id="analysis-section" className="space-y-4">
            <button
              onClick={handleBackToExplorer}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Explorer
            </button>

            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
              <div className="bg-red-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold mb-1">
                      AI-Powered Transaction Analysis
                    </h2>
                    <p className="text-red-100 text-sm">
                      {selectedTxHash ? `Transaction: ${formatAddress(selectedTxHash)}` : 'Processing...'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-white bg-opacity-20 rounded-md flex items-center gap-1.5 text-xs font-medium">
                      <DollarSign className="w-3.5 h-3.5" />
                      Price Enhanced
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                {mermaidChart && (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-base font-semibold text-gray-900">Transaction Flow Visualization</h3>
                      <button
                        onClick={() => setIsDiagramModalOpen(true)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        title="View full screen"
                      >
                        <Maximize2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <MermaidDiagram chart={mermaidChart} />
                    </div>
                  </div>
                )}

                <div className="prose max-w-none prose-sm">
                  {currentMessage && (
                    <div dangerouslySetInnerHTML={{ 
                      __html: formatAssistantMessage(currentMessage)
                    }} />
                  )}
                </div>

                {isLoading && (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-red-600 mb-3" />
                    <p className="text-gray-600 font-medium text-sm">Analyzing transaction please wait...</p>
                    <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Explorer View - Compact
          <div className="space-y-4">
            {/* Stats Overview - Inline */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Latest Block</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      #{networkStats.latestBlock.toLocaleString()}
                    </p>
                  </div>
                  <Blocks className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Pending Txns</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      {networkStats.pendingTxns}
                    </p>
                  </div>
                  <Activity className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Network</p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">C-Chain</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">USD Feeds</p>
                    <p className="text-base font-bold text-green-600 mt-0.5">Active</p>
                  </div>
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Blocks and Transactions Section */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Latest Blocks - Compact */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-100 rounded-md flex items-center justify-center">
                          <Blocks className="w-4 h-4 text-red-600" />
                        </div>
                        Latest Blocks
                      </h2>
                      <button
                        onClick={fetchBlockchainData}
                        className={`p-1.5 rounded-md transition-colors ${
                          isRefreshing ? 'bg-gray-100' : 'hover:bg-gray-100'
                        }`}
                        disabled={isRefreshing}
                      >
                        <RefreshCw className={`w-4 h-4 text-gray-600 ${
                          isRefreshing ? 'animate-spin' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 flex-grow overflow-y-auto">
                    {isLoadingChainData && latestBlocks.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                        <p className="text-sm text-gray-500">Loading blocks...</p>
                      </div>
                    ) : (
                      latestBlocks.slice(0, 20).map((block) => (
                        <div 
                          key={block.number} 
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all group"
                          onClick={() => handleBlockClick(block)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center group-hover:border-red-300 transition-all">
                                <Blocks className="w-5 h-5 text-red-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">
                                  Block #{block.number.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    {block.transaction_count} txns
                                  </span>
                                  <span>•</span>
                                  <span>{new Date(block.timestamp * 1000).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 mt-auto">
                    <a href="/blocks" className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1">
                      View all blocks
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Recent Transactions - Compact */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-7 h-7 bg-red-100 rounded-md flex items-center justify-center">
                          <Hash className="w-4 h-4 text-red-600" />
                        </div>
                        Recent Transactions
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                          With Gas Prices
                        </span>
                      </h2>
                      <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100 flex-grow overflow-y-auto">
                    {isLoadingChainData && recentTransactions.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-red-600 mb-2" />
                        <p className="text-sm text-gray-500">Loading transactions...</p>
                      </div>
                    ) : (
                      recentTransactions.slice(0, 20).map((transaction) => (
                        <div 
                          key={transaction.hash} 
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all group"
                          onClick={() => handleSearch(transaction.hash)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center group-hover:border-red-300 transition-all">
                                <Hash className="w-5 h-5 text-red-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                                  {formatAddress(transaction.hash)}
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded border border-red-200">
                                    Type {transaction.type}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                  From: {formatAddress(transaction.from)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-medium text-red-600 flex items-center gap-1">
                                <Fuel className="w-3 h-3" />
                                <span>{formatGas(transaction.gasPrice)} gwei</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Gas Price
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 mt-auto">
                    <a href="/transactions" className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors flex items-center gap-1">
                      View all transactions
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column - Gas Tracker */}
              <div className="lg:col-span-1 space-y-4">
                <GasTracker />
                
                {/* Additional Info Card - Compact */}
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Why AvaScanAI?</h3>
                  </div>
                  <ul className="space-y-2 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 font-bold">✓</span>
                      <span>Real-time USD values for every token</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 font-bold">✓</span>
                      <span>Sub-second finality analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5 font-bold">✓</span>
                      <span>DeFi P&L analysis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-500 mt-0.5 font-bold">✓</span>
                      <span>Multi-source price confidence</span>
                    </li>
                  </ul>
                  <button className="mt-5 w-full py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                    Learn More →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diagram Modal */}
      <DiagramModal
        isOpen={isDiagramModalOpen}
        onClose={() => setIsDiagramModalOpen(false)}
        chart={mermaidChart || ''}
      />

      {/* Block Transactions Modal */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsBlockModalOpen(false)}
          />
          
          <div className="relative w-full max-w-4xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Block #{selectedBlock?.number.toLocaleString()} Transactions
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {blockTransactions.length} transactions • Click to analyze with price data
                  </p>
                </div>
                <button
                  onClick={() => setIsBlockModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(85vh-88px)] p-6">
              <div className="space-y-3">
                {blockTransactions.map((txHash, index) => (
                  <div
                    key={txHash}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-all flex items-center justify-between group border border-gray-200"
                    onClick={() => {
                      setIsBlockModalOpen(false);
                      handleSearch(txHash);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-lg flex items-center justify-center text-sm font-medium text-red-700">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatAddress(txHash)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Transaction Hash
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-600 font-medium flex items-center gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                        <Fuel className="w-3 h-3" />
                        Gas Analysis Ready
                      </span>
<ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainExplorer;