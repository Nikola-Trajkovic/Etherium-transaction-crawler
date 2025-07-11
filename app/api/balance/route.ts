import { NextRequest, NextResponse } from "next/server";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ETHERSCAN_BASE_URL =
  process.env.ETHERSCAN_BASE_URL || "https://api.etherscan.io/api";

interface BalanceResponse {
  status: string;
  message: string;
  result: string;
}

interface HistoricalBalanceResponse {
  status: string;
  message: string;
  result: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");
  const date = searchParams.get("date"); // YYYY-MM-DD format

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
    let balanceInEth: number;

    if (date) {
      // Convert date to timestamp for historical balance
      const timestamp = Math.floor(
        new Date(date + "T00:00:00Z").getTime() / 1000
      );

      const historicalBalanceUrl = `${ETHERSCAN_BASE_URL}&module=account&action=balancehistory&address=${address}&blockno=${timestamp}&apikey=${ETHERSCAN_API_KEY}`;
      const historicalBalanceResponse = await fetch(historicalBalanceUrl);
      const historicalBalanceData: HistoricalBalanceResponse =
        await historicalBalanceResponse.json();

      if (historicalBalanceData.status === "0") {
        return NextResponse.json(
          { error: "Failed to fetch historical balance" },
          { status: 400 }
        );
      }

      balanceInEth =
        parseFloat(historicalBalanceData.result) / Math.pow(10, 18);
    } else {
      // Current balance
      const balanceUrl = `${ETHERSCAN_BASE_URL}&module=account&action=balance&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
      const balanceResponse = await fetch(balanceUrl);
      const balanceData: BalanceResponse = await balanceResponse.json();
      console.log(balanceUrl);
      

      if (balanceData.status === "0") {
        return NextResponse.json(
          { error: "Failed to fetch balance" },
          { status: 400 }
        );
      }

      balanceInEth = parseFloat(balanceData.result) / Math.pow(10, 18);
    }

    return NextResponse.json({
      address,
      balance: balanceInEth,
      date: date || "current",
      timestamp: date
        ? new Date(date + "T00:00:00Z").toISOString()
        : new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance data" },
      { status: 500 }
    );
  }
}
