import { NextRequest, NextResponse } from "next/server";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL =
  process.env.ETHERSCAN_BASE_URL || "https://api.etherscan.io/api";

interface Transaction {
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
}

interface TransactionsResponse {
  status: string;
  message: string;
  result: Transaction[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const startBlock = searchParams.get("startBlock");
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const transactionType = searchParams.get("type") || "normal"; // normal or internal

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
    let transactionsUrl: string;

    if (transactionType === "internal") {
      transactionsUrl = `${ETHERSCAN_BASE_URL}&module=account&action=txlistinternal&address=${address}&startblock=${
        startBlock || 0
      }&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
      
    } else {
      transactionsUrl = `${ETHERSCAN_BASE_URL}&module=account&action=txlist&address=${address}&startblock=${
        startBlock || 0
      }&endblock=99999999&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    }
    console.log(transactionsUrl);

    const transactionsResponse = await fetch(transactionsUrl);
    const transactionsData: TransactionsResponse =
      await transactionsResponse.json();

    if (transactionsData.status === "0") {
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 400 }
      );
    }

    // Process transactions to include ETH values
    const processedTransactions = transactionsData.result.map((tx) => ({
      ...tx,
      valueInEth: parseFloat(tx.value) / Math.pow(10, 18),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      type: transactionType,
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
      transactionType,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction data" },
      { status: 500 }
    );
  }
}
