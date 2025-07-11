import { NextRequest, NextResponse } from "next/server";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL =
  process.env.ETHERSCAN_BASE_URL || "https://api.etherscan.io/api";

interface TokenTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  contractAddress: string;
  confirmations: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
}

interface TokenTransactionsResponse {
  status: string;
  message: string;
  result: TokenTransaction[];
}

interface TokenBalance {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  balance: string;
}

interface TokenBalancesResponse {
  status: string;
  message: string;
  result: TokenBalance[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const startBlock = searchParams.get("startBlock");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const action = searchParams.get("action") || "transactions"; // transactions or balances

  console.log("USAO");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  if (!ETHERSCAN_API_KEY) {
    return NextResponse.json(
      { error: "Etherscan API key is not configured" },
      { status: 500 }
    );
  }

  try {
    if (action === "balances") {
      // Fetch token balances
      const tokenBalancesUrl = `${ETHERSCAN_BASE_URL}&module=account&action=tokentx&address=${address}&startblock=${
        startBlock || 0
      }&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
      console.log(tokenBalancesUrl);
      const tokenBalancesResponse = await fetch(tokenBalancesUrl);
      const tokenBalancesData: TokenBalancesResponse =
        await tokenBalancesResponse.json();

      if (tokenBalancesData.status === "0") {
        return NextResponse.json(
          { error: "Failed to fetch token balances" },
          { status: 400 }
        );
      }

      // Process token balances
      const processedBalances = tokenBalancesData.result.map((token) => ({
        ...token,
        balanceInTokens:
          parseFloat(token.balance) /
          Math.pow(10, parseInt(token.tokenDecimal)),
      }));

      return NextResponse.json({
        address,
        tokenBalances: processedBalances,
        totalTokens: processedBalances.length,
      });
    } else {
      // Fetch token transactions
      const tokenTransactionsUrl = `${ETHERSCAN_BASE_URL}&module=account&action=tokentx&address=${address}&startblock=${
        startBlock || 0
      }&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;

      console.log(tokenTransactionsUrl);

      const tokenTransactionsResponse = await fetch(tokenTransactionsUrl);
      const tokenTransactionsData: TokenTransactionsResponse =
        await tokenTransactionsResponse.json();

      if (tokenTransactionsData.status === "0") {
        return NextResponse.json(
          { error: "Failed to fetch token transactions" },
          { status: 400 }
        );
      }

      // Process token transactions
      const processedTransactions = tokenTransactionsData.result.map((tx) => ({
        ...tx,
        valueInTokens:
          parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal)),
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        type: "token",
      }));

      // Apply pagination
      const totalTransactions = processedTransactions.length;
      const totalPages = Math.ceil(totalTransactions / pageSize);
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedTransactions = processedTransactions.slice(
        startIndex,
        endIndex
      );

      return NextResponse.json({
        address,
        transactions: paginatedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalTransactions,
          pageSize,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
        transactionType: "token",
      });
    }
  } catch (error) {
    console.error("Error fetching token data:", error);
    return NextResponse.json(
      { error: "Failed to fetch token data" },
      { status: 500 }
    );
  }
}
