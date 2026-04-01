'use client'
"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "./stat-card";
import { SalesChart } from "./sales-chart";
import { TopProductsChart } from "./top-products-chart";
import { RecentOrders } from "./recent-orders";

interface DashboardData {
  revenue: number;
  transactions: number;
  avgOrder: number;
  itemsSold: number;
  revenueChange: number | null;
  transactionsChange: number | null;
  avgOrderChange: number | null;
  itemsSoldChange: number | null;
  salesByDay: Array<{ date: string; revenue: number; label: string }>;
  topProducts: Array<{ name: string; revenue: number; quantity: number }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    createdAt: string;
    itemCount: number;
    total: number;
    paymentMethod: "CARD" | "CASH" | "TAP";
    status: "PENDING" | "COMPLETED" | "REFUNDED" | "CANCELLED";
    userName: string | null;
  }>;
}

interface DashboardOverviewProps {
  initialData: DashboardData;
}

export function DashboardOverview({ initialData }: DashboardOverviewProps) {
  const [data, setData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (period: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePeriodChange = useCallback(
    (period: string) => {
      fetchData(period);
    },
    [fetchData]
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(data.revenue)}
          icon={DollarSign}
          change={data.revenueChange}
        />
        <StatCard
          title="Transactions"
          value={data.transactions.toLocaleString()}
          icon={ShoppingCart}
          change={data.transactionsChange}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(data.avgOrder)}
          icon={TrendingUp}
          change={data.avgOrderChange}
        />
        <StatCard
          title="Items Sold"
          value={data.itemsSold.toLocaleString()}
          icon={Package}
          change={data.itemsSoldChange}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart
            data={data.salesByDay}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        <div>
          <TopProductsChart data={data.topProducts} />
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={data.recentOrders} />
    </div>
  );
}
