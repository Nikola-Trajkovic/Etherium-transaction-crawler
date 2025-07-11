import { NextRequest, NextResponse } from "next/server";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL =
  process.env.ETHERSCAN_BASE_URL || "https://api.etherscan.io/v2/api";

interface TokenBalanceResponse {
  status: string;
  message: string;
  result: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const contractAddress = searchParams.get("contractAddress");

  if (!address) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }

  if (!contractAddress) {
    return NextResponse.json(
      { error: "Contract address is required" },
      { status: 400 }
    );
  }

  if (!ETHERSCAN_API_KEY) {
    return NextResponse.json(
      { error: "Etherscan API key is not configured" },
      { status: 500 }
    );
  }

  try {
    const tokenBalanceUrl = `${ETHERSCAN_BASE_URL}&module=account&action=tokenbalance&contractaddress=${contractAddress}&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;

    console.log("Fetching token balance:", tokenBalanceUrl);

    const response = await fetch(tokenBalanceUrl);
    const data: TokenBalanceResponse = await response.json();

    if (data.status === "0") {
      return NextResponse.json(
        { error: "Failed to fetch token balance" },
        { status: 400 }
      );
    }

    // Convert from wei to tokens (assuming 18 decimals for most tokens)
    const balanceInTokens = parseFloat(data.result) / Math.pow(10, 18);

    return NextResponse.json({
      address,
      contractAddress,
      balance: balanceInTokens,
      rawBalance: data.result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch token balance" },
      { status: 500 }
    );
  }
}
