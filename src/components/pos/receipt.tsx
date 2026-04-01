"use client";

import { formatCurrency } from "@/lib/utils";
import type { OrderResult } from "@/components/pos/pos-terminal";

interface ReceiptProps {
  order: OrderResult;
}

export function Receipt({ order }: ReceiptProps) {
  const date = new Date(order.createdAt);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-[300px] p-4 font-mono text-xs leading-relaxed text-black">
      {/* Header */}
      <div className="mb-4 text-center">
        <h1 className="text-lg font-bold">TapPOS</h1>
        <p className="text-[10px] text-gray-600">Point of Sale Receipt</p>
      </div>

      {/* Divider */}
      <div className="mb-2 border-b border-dashed border-gray-400" />

      {/* Order info */}
      <div className="mb-2 flex justify-between">
        <span>Order:</span>
        <span className="font-bold">{order.orderNumber}</span>
      </div>
      <div className="mb-2 flex justify-between">
        <span>Date:</span>
        <span>{formattedDate}</span>
      </div>
      <div className="mb-3 flex justify-between">
        <span>Time:</span>
        <span>{formattedTime}</span>
      </div>

      {/* Divider */}
      <div className="mb-2 border-b border-dashed border-gray-400" />

      {/* Items */}
      <div className="mb-3 space-y-1">
        {order.items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between">
              <span className="flex-1 truncate pr-2">{item.name}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
            {item.quantity > 1 && (
              <div className="text-[10px] text-gray-500">
                &nbsp;&nbsp;{item.quantity} x {formatCurrency(item.price)}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="mb-2 border-b border-dashed border-gray-400" />

      {/* Totals */}
      <div className="mb-1 flex justify-between">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </div>
      {order.discount > 0 && (
        <div className="mb-1 flex justify-between text-emerald-700">
          <span>Discount</span>
          <span>-{formatCurrency(order.discount)}</span>
        </div>
      )}
      <div className="mb-1 flex justify-between">
        <span>Tax</span>
        <span>{formatCurrency(order.tax)}</span>
      </div>

      <div className="mb-3 border-b border-dashed border-gray-400" />

      <div className="mb-3 flex justify-between text-sm font-bold">
        <span>TOTAL</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      {/* Payment info */}
      <div className="mb-1 flex justify-between">
        <span>Payment</span>
        <span>{order.paymentMethod}</span>
      </div>
      {order.paymentMethod === "CASH" && order.cashReceived != null && (
        <>
          <div className="mb-1 flex justify-between">
            <span>Cash Received</span>
            <span>{formatCurrency(order.cashReceived)}</span>
          </div>
          <div className="mb-1 flex justify-between font-bold">
            <span>Change</span>
            <span>{formatCurrency(order.changeGiven ?? 0)}</span>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-dashed border-gray-400 pt-3 text-center">
        <p className="text-[10px] text-gray-500">Thank you for your purchase!</p>
        <p className="text-[10px] text-gray-400">Powered by TapPOS</p>
      </div>
    </div>
  );
}
