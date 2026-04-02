import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/partners/dashboard"); // PARTNER users have no tenantId
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = subDays(todayStart, 1);
  const chartStart = subDays(todayStart, 7);

  const [todayOrders, yesterdayOrders, chartOrders, topProductsData, recentOrdersData] =
    await Promise.all([
      db.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { in: ["COMPLETED", "PENDING"] },
        },
        include: { items: true },
      }),
      db.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: yesterdayStart, lt: todayStart },
          status: { in: ["COMPLETED", "PENDING"] },
        },
        include: { items: true },
      }),
      db.order.findMany({
        where: {
          tenantId,
          createdAt: { gte: chartStart, lte: todayEnd },
          status: { in: ["COMPLETED", "PENDING"] },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      db.orderItem.groupBy({
        by: ["name"],
        where: {
          order: {
            tenantId,
            createdAt: { gte: chartStart, lte: todayEnd },
            status: { in: ["COMPLETED", "PENDING"] },
          },
        },
        _sum: { price: true, quantity: true },
        orderBy: { _sum: { price: "desc" } },
        take: 5,
      }),
      db.order.findMany({
        where: { tenantId },
        include: {
          items: true,
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

  // Today stats
  const revenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const transactions = todayOrders.length;
  const avgOrder = transactions > 0 ? Math.round(revenue / transactions) : 0;
  const itemsSold = todayOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  // Yesterday stats
  const yRevenue = yesterdayOrders.reduce((sum, o) => sum + o.total, 0);
  const yTransactions = yesterdayOrders.length;
  const yAvgOrder = yTransactions > 0 ? Math.round(yRevenue / yTransactions) : 0;
  const yItemsSold = yesterdayOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  const calcChange = (current: number, previous: number): number | null => {
    if (previous === 0) return current > 0 ? 100 : null;
    return ((current - previous) / previous) * 100;
  };

  // Chart data grouped by day
  const salesMap = new Map<string, number>();
  for (let d = 7; d >= 0; d--) {
    const dayDate = subDays(now, d);
    const key = format(dayDate, "EEE");
    salesMap.set(key, 0);
  }
  for (const order of chartOrders) {
    const key = format(order.createdAt, "EEE");
    salesMap.set(key, (salesMap.get(key) || 0) + order.total);
  }
  const salesByDay = Array.from(salesMap.entries()).map(([label, rev]) => ({
    date: label,
    revenue: rev,
    label,
  }));

  const topProducts = topProductsData.map((p) => ({
    name: p.name,
    revenue: p._sum.price || 0,
    quantity: p._sum.quantity || 0,
  }));

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

  const initialData = {
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
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your business performance
        </p>
      </div>
      <DashboardOverview initialData={initialData} />
    </div>
  );
}
