"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditCard, Banknote, Smartphone } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderData {
  id: string;
  orderNumber: string;
  createdAt: string;
  itemCount: number;
  total: number;
  paymentMethod: "CARD" | "CASH" | "TAP";
  status: "PENDING" | "COMPLETED" | "REFUNDED" | "CANCELLED";
  userName: string | null;
}

interface RecentOrdersProps {
  orders: OrderData[];
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  COMPLETED: { label: "Completed", variant: "default" },
  REFUNDED: { label: "Refunded", variant: "outline" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
};

const paymentIcons: Record<string, { icon: typeof CreditCard; label: string }> = {
  CARD: { icon: CreditCard, label: "Card" },
  CASH: { icon: Banknote, label: "Cash" },
  TAP: { icon: Smartphone, label: "Tap" },
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Recent Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Payment</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-8 text-center text-muted-foreground"
                >
                  No orders yet
                </TableCell>
              </TableRow>
            )}
            {orders.map((order) => {
              const status = statusConfig[order.status];
              const payment = paymentIcons[order.paymentMethod];
              const PaymentIcon = payment.icon;

              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(new Date(order.createdAt))}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.userName || "Unknown"}
                  </TableCell>
                  <TableCell className="text-center">
                    {order.itemCount}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <PaymentIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {payment.label}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
