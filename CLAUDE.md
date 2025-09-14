# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Environment Setup
- Copy `.env.local.example` to `.env.local` and add your OpenAI API key
- The project uses Next.js 14.2.3 with TypeScript
- No specific test framework is configured

## Architecture Overview

### Core Components

**AvalancheAI** is an AI-powered Avalanche blockchain explorer that provides real-time gas tracking, network insights, and intelligent transaction analysis for the Avalanche C-Chain network.

### Key Technical Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **AI Integration**: OpenAI GPT-4 via AI SDK
- **Blockchain**: Ethers.js 6.14.1 for Ethereum-compatible interactions
- **Network**: Avalanche C-Chain mainnet/testnet RPC endpoints
- **Visualization**: Mermaid.js for transaction flow diagrams

### Architecture Layers

1. **API Layer** (`app/api/chat/`)
   - `route.ts`: Main API endpoint handling transaction analysis
   - `systemPrompt.ts`: Instructions for AI transaction interpretation
   - `helpers/`: Core business logic modules

2. **Network Integration** (`app/api/chat/helpers/`)
   - `chainManager.ts`: Etherlink RPC provider management
   - `eventsProcessor.ts`: Ethereum-style event decoding and classification
   - `tokensMetadataManager.ts`: ERC-20/721/1155 token metadata handling

3. **Data Processing** (`app/api/chat/helpers/`)
   - `chainManager.ts`: RPC provider management for Avalanche
   - `eventsProcessor.ts`: Ethereum log parsing and event classification
   - Transaction analysis with gas efficiency calculations

4. **UI Components** (`app/components/`)
   - `BlockchainExplorer.tsx`: Main interface component
   - `GasTracker.tsx`: Real-time gas price monitoring
   - `MermaidDiagram.tsx`: Transaction flow visualization

### Data Flow

1. **Transaction Analysis**: User provides transaction hash → API fetches from Avalanche RPC
2. **Event Processing**: Raw logs decoded into transfers, swaps, and contract interactions
3. **Gas Analysis**: Real-time gas price data and efficiency calculations
4. **AI Analysis**: GPT-4 processes enhanced data to generate human-readable insights
5. **Visualization**: Mermaid diagrams show transaction flows with gas costs

### Key Features Implementation

- **Real-time Gas Tracking**: Live gas price monitoring with efficiency analysis
- **Network Metrics**: Block utilization, transaction throughput, network health
- **AI Insights**: GPT-4 explains complex EVM transactions in plain English
- **Visual Flows**: Mermaid diagrams with gas costs and AVAX values

### Configuration Notes

- **Mainnet**: Uses chain ID 43114, RPC endpoint: `https://api.avax.network/ext/bc/C/rpc`
- **Testnet**: Uses chain ID 43113, RPC endpoint: `https://api.avax-test.network/ext/bc/C/rpc`
- **Native Currency**: AVAX (Avalanche) with 18 decimals
- **EVM Compatibility**: Full Ethereum tooling support

### Development Guidelines

- Transaction analysis requires both blockchain data and gas efficiency calculations
- All gas values should be calculated in wei/gwei/AVAX units
- AI responses follow structured format with specific section headers
- Mermaid diagrams must include gas costs when available
- Error handling includes fallbacks when network data is unavailable

### Important Files

- `app/api/chat/route.ts`: Main transaction analysis logic
- `app/api/chat/helpers/chainManager.ts`: Avalanche network configuration
- `app/components/BlockchainExplorer.tsx`: Primary UI component
- `app/components/GasTracker.tsx`: Gas price monitoring component
- `app/api/chat/systemPrompt.ts`: AI response formatting instructions

The project integrates cutting-edge AI analysis with real-time Avalanche network data to make high-performance EVM-compatible transactions accessible and actionable for users, while showcasing the benefits of Avalanche's consensus mechanism and sub-second finality.