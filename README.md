# AvaScanAI - Enterprise Avalanche Intelligence Platform

## 🏆 Built for Avalanche C-Chain - High-Performance EVM-Compatible Network

AvaScanAI is an enterprise-grade blockchain intelligence platform designed for developers, infrastructure teams, and enterprises operating on **Avalanche C-Chain**. We provide professional-grade gas efficiency tracking, transaction flow visualization, and intelligent analysis for mission-critical Avalanche operations.

*AvaScanAI is an enterprise-grade intelligence platform built for the Avalanche C-Chain, combining sub-second finality, low gas costs, and EVM compatibility with AI-powered analytics. Unlike traditional explorers, it transforms raw blockchain data into actionable insights by leveraging GPT-4 for transaction analysis, real-time gas tracking, price feed aggregation, and DeFi protocol detection. With interactive flow visualizations, risk assessment, portfolio tracking, and a network intelligence dashboard, AvaScanAI empowers developers, enterprises, and infrastructure teams to optimize gas efficiency, monitor network health, and make smarter decisions in production-grade Avalanche operations*



### 🎯 Avalanche C-Chain Integration Highlights

- **⚡ Sub-Second Finality**: Lightning-fast transaction confirmations
- **💰 Low Gas Costs**: Efficient transaction processing with AVAX
- **🔗 EVM Compatibility**: Full Ethereum tooling support with Avalanche benefits
- **🏔️ Avalanche Consensus**: Leveraging Avalanche's revolutionary consensus mechanism

## 🚀 How AvaScanAI Works

AvaScanAI transforms complex blockchain data into actionable business intelligence by leveraging

1. **OpenAI GPT-4** for intelligent transaction analysis
2. **Avalanche C-Chain** for real-time gas tracking and network metrics
3. **Real-time Price Feeds** for accurate USD valuations
4. **Advanced DeFi Detection** for protocol-specific insights

Unlike traditional explorers that show raw data, AvaScanAI provides **enterprise-grade network intelligence** that helps development teams optimize gas efficiency, reduce transaction costs, and monitor network performance for production applications.

## 🌟 Key Features

### 1. **Avalanche Gas Tracking** 🟢 NEW!

Real-time gas price monitoring and optimization recommendations:
- **Current Gas Price**: Live AVAX gas prices in gwei
- **Network Congestion**: Real-time network status indicator  
- **Gas Efficiency Score**: Rate your transaction's gas usage
- **Optimization Tips**: AI-powered suggestions for gas savings
- **Historical Trends**: Gas price patterns for optimal timing
- **Total Transaction Cost**: Aggregate AVAX cost for all operations

### 2. **AI-Powered Transaction Analysis** 🧠

Comprehensive analysis of every Avalanche transaction:
- **Smart Contract Interaction Detection**: Identifies DeFi protocols and dApps
- **Value Flow Analysis**: Tracks token transfers with USD calculations
- **Gas Efficiency Scoring**: Rates transaction optimization (0-100%)
- **Risk Assessment**: Security analysis with confidence levels
- **DeFi Strategy Detection**: Identifies yield farming, swapping, lending patterns

### 3. **Real-Time USD Value Tracking** 💰

Live price integration for all tokens:
- **Multi-Source Price Feeds**: Aggregated pricing from top exchanges
- **Portfolio Impact Analysis**: How transactions affect your holdings
- **P&L Calculations**: Profit/loss tracking for DeFi activities
- **Market Impact Assessment**: Transaction size vs. liquidity analysis

### 4. **Interactive Flow Visualizations** 📊

Mermaid.js diagrams showing transaction flows:
- **Token Transfer Paths**: Visual representation of value movement
- **DeFi Protocol Interactions**: Shows complex multi-step transactions
- **Gas Cost Breakdown**: Visual gas usage across transaction steps
- **Price Data Integration**: Shows USD values in diagrams

### 5. **Network Intelligence Dashboard** 📈

Real-time Avalanche C-Chain metrics:
- **Live Block Explorer**: Latest blocks and transactions
- **Network Health**: TPS, block times, congestion levels
- **Price Feed Status**: Real-time indicator showing oracle connectivity

### 6. **Avalanche-Native Support** 🏗️

- **High-Speed Processing**: Optimized for Avalanche's fast block times
- **AVAX Integration**: Native support for AVAX transfers and staking
- **Subnet Awareness**: Understanding of Avalanche's multi-chain architecture
- **Event Decoding**: Interprets Avalanche events with token metadata

## 📊 Price Oracle Features in Detail

### Multi-Source Price Aggregation
- **Real-time USD Prices**: Live market data for accurate valuations
- **Confidence Scoring**: Reliability indicators for price data (85-99%)
- **Source Transparency**: Shows which exchanges provide pricing
- **Historical Price Context**: 24h change indicators with trend analysis

### DeFi Position Tracking  
- **Yield Farming ROI**: Calculate returns from liquidity provision
- **Impermanent Loss**: Track IL for LP positions with recommendations
- **Portfolio Rebalancing**: Suggests optimal position adjustments
- **Cross-Protocol Analysis**: Compare yields across different platforms

## 🔄 How It Works

```
User Query → AI Analysis → Blockchain Data → Price Feeds → Enhanced Insights
```

## 🛠️ Tech Stack

### Core Technologies
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-4 via Vercel AI SDK
- **Blockchain**: Ethers.js 6.14.1
- **Visualization**: Mermaid.js for transaction flow diagrams

### Avalanche Integration Components
- `chainManager.ts`: Avalanche RPC connection and management
- `priceIntelligenceService.ts`: Real-time price feed integration
- `defiProtocolDetector.ts`: Avalanche DeFi protocol detection

## 🎯 Getting Started

### Prerequisites
- Node.js 18+ 
- OpenAI API key for AI analysis

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd AvaScanAI

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Add your OpenAI API key to .env.local

# Start development server
npm run dev
```

### Usage

1. Enter any Avalanche C-Chain transaction hash
2. View comprehensive AI analysis with gas insights
3. Explore interactive transaction flow diagrams
4. Review DeFi insights with real-time price data

## 📁 Project Structure

```
app/
├── api/chat/
│   ├── route.ts                    # Main API endpoint
│   ├── systemPrompt.ts             # AI instructions
│   └── helpers/
│       ├── chainManager.ts         # Avalanche network management
│       ├── eventsProcessor.ts      # Transaction event processing
│       ├── priceIntelligenceService.ts  # Price feed integration
│       ├── defiProtocolDetector.ts # DeFi protocol detection
│       └── securityAssessmentService.ts # Security analysis
├── components/
│   ├── BlockchainExplorer.tsx      # Main explorer interface
│   ├── GasTracker.tsx              # Real-time gas tracking
│   └── DeFiAnalyticsDashboard.tsx  # DeFi insights dashboard
└── utils/
    ├── formatUtils.ts              # Data formatting utilities
    └── messageFormatter.ts         # AI response formatting
```

## 🏆 Hackathon Integration

### Track: Build with AI
- **AI Integration**: Full implementation of GPT-4 for transaction analysis
- **Real-time Processing**: Live blockchain data integration
- **User Experience**: Intuitive interface for complex blockchain data

### Track: DeFi Innovation
- **Protocol Detection**: Automatic identification of DeFi interactions
- **Yield Analysis**: Comprehensive ROI and risk assessment
- **Portfolio Tracking**: Multi-protocol position monitoring

### Impact on Avalanche Ecosystem

AvaScanAI enhances the Avalanche experience by:
- **Reducing Complexity**: Making blockchain data accessible to everyone
- **Improving Decision Making**: AI-powered insights for better trading
- **Promoting Adoption**: User-friendly tools for newcomers

## 📊 Performance Metrics

- **AI Response Time**: < 3 seconds for transaction analysis
- **Price Feed Latency**: < 100ms from price oracles
- **Network Query Speed**: < 500ms for Avalanche RPC calls
- **Real-time Updates**: 2-second block monitoring

*************************************************

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key for AI analysis

## 📖 API Documentation

### Transaction Analysis Endpoint
```bash
POST /api/chat
{
  "txHash": "0x...",
  "chainId": 43114
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support & Community

- **GitHub Issues**: Report bugs and request features
- **Avalanche Discord**: Join for ecosystem support

## 🙏 Acknowledgments

- **Avalanche Team**: For the revolutionary blockchain infrastructure
- **OpenAI**: For powerful AI capabilities
- **Next.js Team**: For the amazing development framework

---

**Built with ❤️ for the Avalanche ecosystem**