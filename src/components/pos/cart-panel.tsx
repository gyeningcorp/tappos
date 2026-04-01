'use client'
"use client";

import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Tag,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency } from "@/lib/utils";
import type { CartItem, CouponData } from "@/components/pos/pos-terminal";

interface CartPanelProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  coupon: CouponData | null;
  tenantId: string;
  onUpdateQuantity: (itemId: string, delta: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onApplyCoupon: (coupon: CouponData) => void;
  onRemoveCoupon: () => void;
  onPay: (method: "CARD" | "CASH") => void;
}

export function CartPanel({
  items,
  subtotal,
  discount,
  tax,
  total,
  coupon,
  tenantId,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onApplyCoupon,
  onRemoveCoupon,
  onPay,
}: CartPanelProps) {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError("");
    setCouponLoading(true);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || "Invalid coupon");
        return;
      }

      onApplyCoupon(data.coupon);
      setCouponCode("");
    } catch {
      setCouponError("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const isEmpty = items.length === 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Current Order</h2>
          {items.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </div>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onClearCart}
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-gray-400">
            <ShoppingCart className="mb-3 h-12 w-12" />
            <p className="text-sm font-medium">Cart is empty</p>
            <p className="text-xs">Tap a product to add it</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.price)} each
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Line total */}
                <span className="w-16 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50">
        {/* Coupon section */}
        {!isEmpty && (
          <div className="border-b px-4 py-3">
            {coupon ? (
              <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {coupon.code}
                  </span>
                  <span className="text-xs text-emerald-600">
                    (
                    {coupon.type === "PERCENTAGE"
                      ? `${coupon.value}% off`
                      : `${formatCurrency(coupon.value)} off`}
                    )
                  </span>
                </div>
                <button
                  onClick={onRemoveCoupon}
                  className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleApplyCoupon();
                    }}
                    className="h-10 text-sm uppercase"
                  />
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 shrink-0 px-4"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                {couponError && (
                  <p className="mt-1 text-xs text-red-500">{couponError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1.5 px-4 py-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax (8.875%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="flex gap-3 px-4 pb-4">
          <Button
            className={cn(
              "h-14 flex-1 gap-2 text-base font-semibold",
              "bg-indigo-600 hover:bg-indigo-700"
            )}
            disabled={isEmpty}
            onClick={() => onPay("CARD")}
          >
            <CreditCard className="h-5 w-5" />
            Pay with Card
          </Button>
          <Button
            className={cn(
              "h-14 flex-1 gap-2 text-base font-semibold",
              "bg-emerald-600 hover:bg-emerald-700"
            )}
            disabled={isEmpty}
            onClick={() => onPay("CASH")}
          >
            <Banknote className="h-5 w-5" />
            Pay with Cash
          </Button>
        </div>
      </div>
    </div>
  );
}
