"use client";

import { useState, useCallback } from "react";
import { format, subDays } from "date-fns";
import { Download, Calendar, CreditCard, Banknote, Smartphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ReportData {
  totalRevenue: number;
  totalTransactions: number;
  avgOrderValue: number;
  totalItemsSold: number;
  paymentBreakdown: Array<{
    method: string;
    count: number;
    total: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    revenue: number;
    quantity: number;
  }>;
}

const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const weekAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState(weekAgo);
  const [toDate, setToDate] = useState(today);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/stats?period=custom&from=${fromDate}&to=${toDate}`
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      // Compute report data from the stats response
      setData({
        totalRevenue: json.revenue,
        totalTransactions: json.transactions,
        avgOrderValue: json.avgOrder,
        totalItemsSold: json.itemsSold,
        paymentBreakdown: json.paymentBreakdown || [],
        categoryBreakdown: json.categoryBreakdown || [],
      });
    } catch (error) {
      console.error("Failed to fetch report:", error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  const handleExportCSV = useCallback(() => {
    const url = `/api/dashboard/export?from=${fromDate}&to=${toDate}`;
    window.open(url, "_blank");
  }, [fromDate, toDate]);

  const paymentIcons: Record<string, typeof CreditCard> = {
    CARD: CreditCard,
    CASH: Banknote,
    TAP: Smartphone,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analyze your sales data for any date range
        </p>
      </div>

      {/* Date Range Picker */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="from-date">From</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="to-date">To</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              {loading ? "Loading..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {data && (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatMoney(data.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{data.totalTransactions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatMoney(data.avgOrderValue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-2xl font-bold">{data.totalItemsSold}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Sales by Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Sales by Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.paymentBreakdown.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No payment data for this period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment Method</TableHead>
                      <TableHead className="text-center">Transactions</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentBreakdown.map((item) => {
                      const Icon = paymentIcons[item.method] || CreditCard;
                      return (
                        <TableRow key={item.method}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span>{item.method}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.count}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(item.total)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Sales by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.categoryBreakdown.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">
                  No category data for this period
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-center">Units Sold</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.categoryBreakdown.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatMoney(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Select a date range</p>
            <p className="text-muted-foreground">
              Choose from and to dates above, then click Generate Report
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
