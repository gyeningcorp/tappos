import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay, parseISO, format } from "date-fns";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = session.user.tenantId;
  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json(
      { error: "Missing from/to date parameters" },
      { status: 400 }
    );
  }

  const from = startOfDay(parseISO(fromParam));
  const to = endOfDay(parseISO(toParam));

  const orders = await db.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: from, lte: to },
    },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const headers = [
    "Order #",
    "Date",
    "Items",
    "Subtotal",
    "Discount",
    "Tax",
    "Total",
    "Payment Method",
    "Status",
  ];

  const formatMoney = (cents: number) => (cents / 100).toFixed(2);

  const rows = orders.map((order) => {
    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
    return [
      order.orderNumber,
      format(order.createdAt, "yyyy-MM-dd HH:mm:ss"),
      itemCount.toString(),
      formatMoney(order.subtotal),
      formatMoney(order.discount),
      formatMoney(order.tax),
      formatMoney(order.total),
      order.paymentMethod,
      order.status,
    ];
  });

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const filename = `orders_${format(from, "yyyy-MM-dd")}_to_${format(to, "yyyy-MM-dd")}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
