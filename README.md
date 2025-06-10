<!-- @format -->

# Legendary Charts Distributor

An **open-source transparency tool** for the [Charts NFT project](https://jvmi.art/charts). This TypeScript-based system demonstrates exactly how winners are selected for Charts distributions and giveaways, ensuring complete transparency and fairness in the selection process.

## 🌟 Transparency & Trust

This codebase is publicly available to provide full transparency into our winner selection methodology. Anyone can:

- ✅ Verify the selection algorithms are fair and unbiased
- ✅ Reproduce the results using the same data and seeds
- ✅ Audit the code for any potential manipulation
- ✅ Understand exactly how different holder categories are weighted

## Overview

The Legendary Charts Distributor selects **16 total winners** across three categories:

- **8 Top Burn Addresses**: Top transaction initiators from burn transactions
- **4 Collection Holders**: Randomly selected from all NFT holders (weighted by balance)
- **4 Greyscale Holders**: Randomly selected from holders of greyscale NFTs only

## Features

- 🔥 **Burn Transaction Analysis**: Processes transaction hashes to identify top addresses
- 🎨 **NFT Metadata Processing**: Fetches and filters NFTs based on attributes (greyscale palette)
- ⚖️ **Weighted Selection**: Holders with higher balances have proportionally higher chances
- 🎲 **Deterministic Randomness**: Uses seeded algorithms for reproducible results
- 🚫 **Duplicate Prevention**: Ensures no address wins in multiple categories
- 📊 **Detailed Logging**: Comprehensive output with progress indicators

## Quick Start

1. Clone and install:

```bash
git clone <repository-url>
cd legendary-charts-distributor
npm install
```

2. Add your Alchemy API key:

```bash
cp .env.example .env
# Edit .env and add your ALCHEMY_API_KEY
```

3. Run the selection:

```bash
npm start
```

## Project Structure

```
src/
├── index.ts                 # Main entry point and winner selection logic
├── config.ts               # Configuration constants
├── getHolders.ts           # Holder data processing and weighted selection
├── getGreyscaleHolders.ts  # NFT metadata and greyscale holder identification
└── data/
    ├── burn_txs.csv        # Transaction hashes for burn analysis
    └── holders.csv         # NFT holder addresses and balances
```

## How It Works

1. **Analyze Burn Transactions** → Get top 8 addresses from `src/data/burn_txs.csv`
2. **Process Holders** → Load 4,304+ holders from `src/data/holders.csv`
3. **Fetch NFT Metadata** → Get Charts collection data and filter greyscale NFTs
4. **Select Winners** → Use deterministic algorithms to pick 8 winners total
5. **Output Results** → Display all 16 winners with clear categories

## Algorithm Details

### Weighted Selection

- Each holder's address appears in the selection pool multiple times based on their balance
- Example: A holder with 5 NFTs has 5x the chance of being selected compared to a holder with 1 NFT

### Deterministic Randomness

- Uses Fisher-Yates shuffle algorithm with configurable seeds
- Same seed always produces the same results
- Different seeds used for different selection categories to ensure variety

### Duplicate Prevention

- Selected collection holders are removed from the greyscale holder pool
- Ensures no address can win in multiple categories

## Configuration

Key settings in `src/config.ts`:

- `RANDOM_SEED`: Deterministic seed (12345) - change this for different results
- `CHARTS_CONTRACT_ADDRESS`: NFT collection contract on Base network

## Output Format

The system outputs winners in a clear, organized format:

```
🏆 FINAL WINNERS (16 total):

🔥 TOP BURN ADDRESSES (8):
1. 0x1234...5678
2. 0x2345...6789
...

🎨 COLLECTION HOLDERS (4):
1. 0x3456...7890
2. 0x4567...8901
...

🎭 GREYSCALE HOLDERS (4):
1. 0x5678...9012
2. 0x6789...0123
...
```

## Verification

**Reproduce Results:**

1. Same data + same seed = same winners every time
2. All source data included in `src/data/`
3. Selection logic in `src/index.ts`

**Key Points:**

- ✅ Deterministic algorithm
- ✅ Weighted by NFT balance
- ✅ No duplicate winners
- ✅ All code is public

## License

MIT License - This code is freely available for anyone to use, modify, and audit.
