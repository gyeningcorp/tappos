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
  ShoppingBag,
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
  hideHeader?: boolean;
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
  hideHeader,
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
      {/* Header - hidden in mobile bottom sheet (parent provides its own) */}
      {!hideHeader && (
        <div className="flex items-center justify-between border-b px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">Current Order</h2>
            {items.length > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
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
      )}

      {/* Clear all in mobile sheet mode */}
      {hideHeader && !isEmpty && (
        <div className="flex justify-end border-b px-5 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={onClearCart}
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 py-8 text-gray-400">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <ShoppingBag className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No items yet</p>
            <p className="mt-1 text-xs text-gray-400">Tap a product to start your order</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatCurrency(item.price)} each
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-100 active:bg-gray-200"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Line total */}
                <span className="w-16 text-right text-sm font-bold text-gray-900">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                {/* Remove */}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-white">
        {/* Coupon section */}
        {!isEmpty && (
          <div className="border-b border-gray-100 px-5 py-3">
            {coupon ? (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">
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
                  className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-100"
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
                    className="h-9 rounded-lg text-sm uppercase"
                  />
                  <Button
                    variant="outline"
                    size="default"
                    className="h-9 shrink-0 rounded-lg px-4 text-sm"
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
        <div className="space-y-1 px-5 py-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm font-medium text-emerald-600">
              <span>Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax (8.875%)</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="space-y-2 px-5 pb-5 pt-1">
          <Button
            className="h-[52px] w-full gap-2.5 rounded-xl bg-indigo-600 text-base font-bold shadow-sm hover:bg-indigo-700"
            disabled={isEmpty}
            onClick={() => onPay("CARD")}
          >
            <CreditCard className="h-5 w-5" />
            Pay with Card
          </Button>
          <Button
            className="h-[52px] w-full gap-2.5 rounded-xl bg-gray-900 text-base font-bold shadow-sm hover:bg-gray-800"
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
