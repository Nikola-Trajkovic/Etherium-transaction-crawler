# Ethereum Transaction Crawler

A Next.js application that allows users to view transaction data from the Ethereum blockchain for a specific wallet address, starting from a given block number.

## Features

- **Wallet Address Search**: Enter any Ethereum wallet address to view its transactions
- **Historical Balance Lookup**: Get ETH balance for any date in YYYY-MM-DD format
- **Block Range Filtering**: Optionally specify a starting block number to filter transactions
- **Transaction Types**: View normal, internal, and token transactions
- **Pagination**: Fast loading with paginated results (20 transactions per page)
- **Token Support**: View ERC-20 token balances and transactions
- **Real-time Data**: Fetches live data from the Ethereum blockchain via Etherscan API
- **Balance Display**: Shows current or historical ETH balance of the searched address
- **Transaction Details**: Displays transaction hash, from/to addresses, value, block number, and timestamp
- **External Links**: Click on addresses and transaction hashes to view them on Etherscan
- **Performance Optimized**: Separate API calls for different data types with lazy loading

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Etherscan API Key

1. Go to [Etherscan APIs](https://etherscan.io/apis)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Create a `.env.local` file in the project root with:

   ```
   # Required: Your Etherscan API key
   ETHERSCAN_API_KEY=YourApiKeyToken

   # Optional: Custom base URL (defaults to https://api.etherscan.io/api)
   ETHERSCAN_BASE_URL=https://api.etherscan.io/api
   ```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter an Ethereum wallet address (e.g., `0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f`)
2. Optionally enter a starting block number (e.g., `9000000`)
3. Click "Search" to fetch transaction dat
4. View results in two tabs:
   - **Normal Transactions**: Standard ETH transfers
   - **Internal Transactions**: Contract interactions and internal transfers

## API Endpoints

**Available Actions:**
- `balance` - Get current or historical ETH balance
- `normal` - Get paginated normal ETH transactions
- `internal` - Get paginated internal ETH transactions  
- `token` - Get paginated token transactions

**Parameters:**
- `address` (required) - Ethereum wallet address
- `action` (optional) - Type of data to fetch (defaults to "all")
- `page` (optional) - Page number for pagination (defaults to 1)
- `pageSize` (optional) - Items per page (defaults to 20)
- `startBlock` (optional) - Starting block number for filtering

## Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components
- **Etherscan API**: Ethereum blockchain data

## Example Addresses to Test

- `0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f` (Vitalik Buterin's address)
- `0x28C6c06298d514Db089934071355E5743bf21d60` (Binance Hot Wallet)
- `0x21a31Ee1afC51d94C2eFcCAa2092aD1028285549` (Another active address)
