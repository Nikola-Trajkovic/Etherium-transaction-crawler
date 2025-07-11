"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from "react";

interface Transaction {
  blockNumber: string;
  hash: string;
  from: string;
  to: string;
  valueInEth?: number;
  valueInTokens?: number;
  timestamp: string;
  type: string;
  tokenName?: string;
  tokenSymbol?: string;
  tokenDecimal?: string;
  contractAddress?: string;
  gasUsed: string;
  gasPrice: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalTransactions: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BalanceData {
  address: string;
  balance: number;
  date: string;
  timestamp: string;
}

interface TransactionData {
  address: string;
  transactions: Transaction[];
  pagination: PaginationInfo;
  transactionType: string;
}

interface TokenBalanceData {
  address: string;
  contractAddress: string;
  balance: number;
  rawBalance: string;
  timestamp: string;
}

export default function Home() {
  const [formData, setFormData] = useState({
    address: "",
    block: "",
  });
  const [activeTab, setActiveTab] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [transactionData, setTransactionData] =
    useState<TransactionData | null>(null);
  const [tokenBalanceData, setTokenBalanceData] =
    useState<TokenBalanceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handles all input changes using name attribute
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Fetch balance data
  const fetchBalance = async (address: string, date?: string) => {
    try {
      const params = new URLSearchParams({
        address,
        ...(date && { date }),
      });

      const response = await fetch(`/api/balance?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch balance");
      }

      setBalanceData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch balance");
    }
  };

  // Fetch transaction data
  const fetchTransactions = async (
    address: string,
    type: string,
    page: number = 1
  ) => {
    try {
      const params = new URLSearchParams({
        address,
        type,
        page: page.toString(),
        pageSize: "20",
        ...(formData.block && { startBlock: formData.block }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch transactions");
      }

      setTransactionData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch transactions"
      );
    }
  };

  // Fetch token transactions with pagination
  const fetchTokenTransactions = async (address: string, page: number = 1) => {
    try {
      const params = new URLSearchParams({
        address,
        action: "token",
        page: page.toString(),
        pageSize: "20",
        ...(formData.block && { startBlock: formData.block }),
      });

      const response = await fetch(`/api/tokens?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch token transactions");
      }

      setTransactionData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch token transactions"
      );
    }
  };

  // Fetch token balance for a specific token
  const fetchTokenBalance = async (
    address: string,
    contractAddress: string
  ) => {
    try {
      const params = new URLSearchParams({
        address,
        contractAddress,
      });

      const response = await fetch(`/api/token-balance?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch token balance");
      }

      setTokenBalanceData(result);
    } catch (err) {
      console.error("Failed to fetch token balance:", err);
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBalanceData(null);
    setTransactionData(null);

    try {
      // Fetch balance first
      await fetchBalance(formData.address);

      // Fetch token balance for the address itself (as a token)
      await fetchTokenBalance(formData.address, formData.address);

      // Fetch initial transactions
      await fetchTransactions(formData.address, "normal", 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);
    if (formData.address) {
      setLoading(true);
      try {
        if (tab === "token") {
          await fetchTokenTransactions(formData.address, 1);
        } else if (tab !== "tokens") {
          await fetchTransactions(formData.address, tab, 1);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch transactions"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle pagination
  const handlePageChange = async (page: number) => {
    if (formData.address && activeTab !== "tokens") {
      setLoading(true);
      try {
        if (activeTab === "token") {
          await fetchTokenTransactions(formData.address, page);
        } else {
          await fetchTransactions(formData.address, activeTab, page);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch transactions"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatEth = (value: number) => {
    return `${value.toFixed(6)} ETH`;
  };

  const formatTokens = (value: number, symbol?: string) => {
    return `${value.toFixed(6)} ${symbol || "TOKENS"}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const TransactionTable = ({
    transactions,
    pagination,
  }: {
    transactions: Transaction[];
    pagination: PaginationInfo;
  }) => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Hash</th>
              <th className="text-left p-2">From</th>
              <th className="text-left p-2">To</th>
              <th className="text-left p-2">Value</th>
              <th className="text-left p-2">Block</th>
              <th className="text-left p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={index} className="border-b hover:bg-muted">
                <td className="p-2 font-mono text-xs">
                  <a
                    href={`https://etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formatAddress(tx.hash)}
                  </a>
                </td>
                <td className="p-2 font-mono text-xs">
                  <a
                    href={`https://etherscan.io/address/${tx.from}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formatAddress(tx.from)}
                  </a>
                </td>
                <td className="p-2 font-mono text-xs">
                  <a
                    href={`https://etherscan.io/address/${tx.to}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {formatAddress(tx.to)}
                  </a>
                </td>
                <td className="p-2">
                  {tx.valueInEth !== undefined
                    ? formatEth(tx.valueInEth)
                    : tx.valueInTokens !== undefined
                    ? formatTokens(tx.valueInTokens, tx.tokenSymbol)
                    : "0"}
                </td>
                <td className="p-2">{tx.blockNumber}</td>
                <td className="p-2">{formatDate(tx.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Page {pagination.currentPage} of {pagination.totalPages} (
          {pagination.totalTransactions} total)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen py-10 bg-muted">
      <Card className="w-full max-w-xl mb-8">
        <CardHeader>
          <CardTitle>Ethereum Transactions Crawler</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="addressInput">Wallet Address</Label>
              <Input
                id="addressInput"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="0x..."
                required
                disabled={loading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="blockInput">From Block (Optional)</Label>
              <Input
                id="blockInput"
                type="number"
                name="block"
                value={formData.block}
                onChange={handleChange}
                placeholder="e.g. 9000000"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="w-full max-w-4xl mb-8">
          <CardContent className="pt-6">
            <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>
          </CardContent>
        </Card>
      )}

      {balanceData && (
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle>Results for {balanceData.address}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Current Balance: {formatEth(balanceData.balance)}
            </div>
            {tokenBalanceData && (
              <div className="text-sm text-muted-foreground">
                Token Balance: {formatTokens(tokenBalanceData.balance, "TRAC")}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="normal">
                  Normal Transactions
                  {transactionData?.transactionType === "normal" &&
                    transactionData?.pagination && (
                      <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {transactionData.pagination.totalTransactions}
                      </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="internal">
                  Internal Transactions
                  {transactionData?.transactionType === "internal" &&
                    transactionData?.pagination && (
                      <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {transactionData.pagination.totalTransactions}
                      </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="token">
                  Token Transactions
                  {transactionData?.transactionType === "token" &&
                    transactionData?.pagination && (
                      <span className="ml-2 text-xs bg-muted px-2 py-1 rounded">
                        {transactionData.pagination.totalTransactions}
                      </span>
                    )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="normal">
                {loading ? (
                  <div className="text-center py-8">
                    Loading transactions...
                  </div>
                ) : transactionData?.transactionType === "normal" &&
                  transactionData.transactions.length > 0 ? (
                  <TransactionTable
                    transactions={transactionData.transactions}
                    pagination={transactionData.pagination}
                  />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    No normal transactions found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="internal">
                {loading ? (
                  <div className="text-center py-8">
                    Loading transactions...
                  </div>
                ) : transactionData?.transactionType === "internal" &&
                  transactionData.transactions.length > 0 ? (
                  <TransactionTable
                    transactions={transactionData.transactions}
                    pagination={transactionData.pagination}
                  />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    No internal transactions found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="token">
                {loading ? (
                  <div className="text-center py-8">
                    Loading transactions...
                  </div>
                ) : transactionData?.transactionType === "token" &&
                  transactionData.transactions.length > 0 ? (
                  <TransactionTable
                    transactions={transactionData.transactions}
                    pagination={transactionData.pagination}
                  />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    No token transactions found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tokens">
                
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
