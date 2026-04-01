import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  startOfDay,
  endOfDay,
  subDays,
  parseISO,
  format,
} from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "7d";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Determine date range for chart based on period
  let chartStart: Date;
  let chartEnd: Date = todayEnd;
  let groupFormat: string;

  if (period === "custom" && fromParam && toParam) {
    chartStart = startOfDay(parseISO(fromParam));
    chartEnd = endOfDay(parseISO(toParam));
    groupFormat = "MMM dd";
  } else {
    switch (period) {
      case "today":
        chartStart = todayStart;
        groupFormat = "HH:mm";
        break;
      case "30d":
        chartStart = subDays(todayStart, 30);
        groupFormat = "MMM dd";
        break;
      case "90d":
        chartStart = subDays(todayStart, 90);
        groupFormat = "MMM dd";
        break;
      case "7d":
      default:
        chartStart = subDays(todayStart, 7);
        groupFormat = "EEE";
        break;
    }
  }

  const yesterdayStart = subDays(todayStart, 1);
  const yesterdayEnd = startOfDay(now);

  // For custom period reports, use chartStart/chartEnd as the "today" range
  const statsStart = period === "custom" ? chartStart : todayStart;
  const statsEnd = period === "custom" ? chartEnd : todayEnd;

  // Fetch all needed data in parallel
  const [
    periodOrders,
    yesterdayOrders,
    chartOrders,
    topProductsData,
    recentOrdersData,
    paymentBreakdownData,
    categoryBreakdownData,
  ] = await Promise.all([
    // Period orders (today or custom range)
    db.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: statsStart, lte: statsEnd },
        status: { in: ["COMPLETED", "PENDING"] },
      },
      include: { items: true },
    }),

    // Yesterday's orders (for comparison)
    db.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: yesterdayStart, lt: yesterdayEnd },
        status: { in: ["COMPLETED", "PENDING"] },
      },
      include: { items: true },
    }),

    // Orders for chart period
    db.order.findMany({
      where: {
        tenantId,
        createdAt: { gte: chartStart, lte: chartEnd },
        status: { in: ["COMPLETED", "PENDING"] },
      },
      select: { total: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),

    // Top products
    db.orderItem.groupBy({
      by: ["name"],
      where: {
        order: {
          tenantId,
          createdAt: { gte: chartStart, lte: chartEnd },
          status: { in: ["COMPLETED", "PENDING"] },
        },
      },
      _sum: { price: true, quantity: true },
      orderBy: { _sum: { price: "desc" } },
      take: 5,
    }),

    // Recent orders
    db.order.findMany({
      where: { tenantId },
      include: {
        items: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    // Payment method breakdown
    db.order.groupBy({
      by: ["paymentMethod"],
      where: {
        tenantId,
        createdAt: { gte: statsStart, lte: statsEnd },
        status: { in: ["COMPLETED", "PENDING"] },
      },
      _count: true,
      _sum: { total: true },
    }),

    // Category breakdown via order items joined with products
    db.orderItem.findMany({
      where: {
        order: {
          tenantId,
          createdAt: { gte: statsStart, lte: statsEnd },
          status: { in: ["COMPLETED", "PENDING"] },
        },
      },
      include: {
        product: {
          include: { category: { select: { name: true } } },
        },
      },
    }),
  ]);

  // Calculate period stats
  const revenue = periodOrders.reduce((sum, o) => sum + o.total, 0);
  const transactions = periodOrders.length;
  const avgOrder = transactions > 0 ? Math.round(revenue / transactions) : 0;
  const itemsSold = periodOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Calculate yesterday's stats for comparison
  const yRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
  const yTransactions = yesterdayOrders.length;
  const yAvgOrder =
    yTransactions > 0 ? Math.round(yRevenue / yTransactions) : 0;
  const yItemsSold = yesterdayOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Calculate percentage changes
  const calcChange = (current: number, previous: number): number | null => {
    if (previous === 0) return current > 0 ? 100 : null;
    return ((current - previous) / previous) * 100;
  };

  // Group chart data by day/hour
  const salesMap = new Map<string, number>();

  if (period === "today") {
    for (let h = 0; h <= now.getHours(); h++) {
      const hourDate = new Date(todayStart);
      hourDate.setHours(h);
      const key = format(hourDate, "HH:00");
      salesMap.set(key, 0);
    }
  } else {
    const daysDiff = Math.ceil(
      (chartEnd.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    for (let d = daysDiff; d >= 0; d--) {
      const dayDate = subDays(chartEnd, d);
      const key = format(dayDate, groupFormat);
      salesMap.set(key, 0);
    }
  }

  for (const order of chartOrders) {
    const key =
      period === "today"
        ? format(order.createdAt, "HH:00")
        : format(order.createdAt, groupFormat);
    salesMap.set(key, (salesMap.get(key) || 0) + order.total);
  }

  const salesByDay = Array.from(salesMap.entries()).map(([label, rev]) => ({
    date: label,
    revenue: rev,
    label,
  }));

  // Format top products
  const topProducts = topProductsData.map((p) => ({
    name: p.name,
    revenue: p._sum.price || 0,
    quantity: p._sum.quantity || 0,
  }));

  // Format recent orders
  const recentOrders = recentOrdersData.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    createdAt: o.createdAt.toISOString(),
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    total: o.total,
    paymentMethod: o.paymentMethod,
    status: o.status,
    userName: o.user?.name || null,
  }));

  // Format payment breakdown
  const paymentBreakdown = paymentBreakdownData.map((p) => ({
    method: p.paymentMethod,
    count: p._count,
    total: p._sum.total || 0,
  }));

  // Aggregate category breakdown
  const categoryMap = new Map<string, { revenue: number; quantity: number }>();
  for (const item of categoryBreakdownData) {
    const catName = item.product?.category?.name || "Uncategorized";
    const existing = categoryMap.get(catName) || { revenue: 0, quantity: 0 };
    existing.revenue += item.price * item.quantity;
    existing.quantity += item.quantity;
    categoryMap.set(catName, existing);
  }
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      revenue: data.revenue,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({
    revenue,
    transactions,
    avgOrder,
    itemsSold,
    revenueChange: calcChange(revenue, yRevenue),
    transactionsChange: calcChange(transactions, yTransactions),
    avgOrderChange: calcChange(avgOrder, yAvgOrder),
    itemsSoldChange: calcChange(itemsSold, yItemsSold),
    salesByDay,
    topProducts,
    recentOrders,
    paymentBreakdown,
    categoryBreakdown,
  });
}
