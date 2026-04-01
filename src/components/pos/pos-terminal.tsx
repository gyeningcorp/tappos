"use client";

import { useState, useCallback } from "react";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentDialog } from "@/components/pos/payment-dialog";

export type CategoryData = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VariantData = {
  id: string;
  name: string;
  type: string;
  price: number | null;
  stock: number;
  sku: string | null;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  sku: string | null;
  barcode: string | null;
  stock: number;
  lowStockAt: number;
  trackStock: boolean;
  isActive: boolean;
  tenantId: string;
  categoryId: string | null;
  category: CategoryData | null;
  variants: VariantData[];
  createdAt: Date;
  updatedAt: Date;
};

export type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number; // cents
  quantity: number;
  maxStock: number;
};

export type CouponData = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
};

export type OrderResult = {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "CARD" | "CASH";
  cashReceived: number | null;
  changeGiven: number | null;
  items: { name: string; quantity: number; price: number }[];
  createdAt: string;
};

const TAX_RATE = 0.08875;

interface POSTerminalProps {
  categories: CategoryData[];
  products: ProductData[];
  tenantId: string;
}

export function POSTerminal({
  categories,
  products,
  tenantId,
}: POSTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH">("CARD");

  const addToCart = useCallback(
    (product: ProductData, variant?: VariantData) => {
      setCart((prev) => {
        const itemId = variant ? `${product.id}-${variant.id}` : product.id;
        const existing = prev.find((item) => item.id === itemId);
        const price = variant?.price ?? product.price;
        const maxStock = variant?.stock ?? product.stock;

        if (existing) {
          if (product.trackStock && existing.quantity >= maxStock) {
            return prev;
          }
          return prev.map((item) =>
            item.id === itemId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }

        if (product.trackStock && maxStock <= 0) {
          return prev;
        }

        return [
          ...prev,
          {
            id: itemId,
            productId: product.id,
            variantId: variant?.id,
            name: variant ? `${product.name} - ${variant.name}` : product.name,
            price,
            quantity: 1,
            maxStock,
          },
        ];
      });
    },
    []
  );

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return { ...item, quantity: 0 };
          if (newQty > item.maxStock) return item;
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCoupon(null);
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount = coupon
    ? coupon.type === "PERCENTAGE"
      ? Math.round(subtotal * (coupon.value / 100))
      : Math.min(coupon.value, subtotal)
    : 0;

  const taxableAmount = subtotal - discountAmount;
  const tax = Math.round(taxableAmount * TAX_RATE);
  const total = taxableAmount + tax;

  const handlePay = (method: "CARD" | "CASH") => {
    setPaymentMethod(method);
    setPaymentOpen(true);
  };

  const handlePaymentComplete = () => {
    clearCart();
    setPaymentOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 bg-gray-50">
      {/* Left side - Products */}
      <div className="flex w-[65%] flex-col overflow-hidden">
        <ProductGrid
          products={products}
          categories={categories}
          onAddToCart={addToCart}
        />
      </div>

      {/* Right side - Cart */}
      <div className="flex w-[35%] flex-col border-l bg-white shadow-lg">
        <CartPanel
          items={cart}
          subtotal={subtotal}
          discount={discountAmount}
          tax={tax}
          total={total}
          coupon={coupon}
          tenantId={tenantId}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClearCart={clearCart}
          onApplyCoupon={setCoupon}
          onRemoveCoupon={() => setCoupon(null)}
          onPay={handlePay}
        />
      </div>

      {/* Payment dialog */}
      <PaymentDialog
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        method={paymentMethod}
        cart={cart}
        subtotal={subtotal}
        discount={discountAmount}
        tax={tax}
        total={total}
        coupon={coupon}
        tenantId={tenantId}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
