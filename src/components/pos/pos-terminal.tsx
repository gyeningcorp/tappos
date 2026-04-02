"use client";

import { useState, useCallback, useEffect } from "react";
import { ShoppingCart, X, Store, User } from "lucide-react";
import { ProductGrid } from "@/components/pos/product-grid";
import { CartPanel } from "@/components/pos/cart-panel";
import { PaymentDialog } from "@/components/pos/payment-dialog";
import { formatCurrency } from "@/lib/utils";

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
  merchantName: string;
  cashierName: string;
}

export function POSTerminal({
  categories,
  products,
  tenantId,
  merchantName,
  cashierName,
}: POSTerminalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "CASH">("CARD");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Lock body scroll when mobile cart is open
  useEffect(() => {
    if (mobileCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileCartOpen]);

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

  const totalItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  const handlePay = (method: "CARD" | "CASH") => {
    setPaymentMethod(method);
    setPaymentOpen(true);
    setMobileCartOpen(false);
  };

  const handlePaymentComplete = () => {
    clearCart();
    setPaymentOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50 md:flex-row">
      {/* Header - mobile only */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2.5 md:hidden">
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-900">{merchantName}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <User className="h-3.5 w-3.5" />
          <span>{cashierName}</span>
        </div>
      </div>

      {/* Left side - Products (full width on mobile) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ProductGrid
          products={products}
          categories={categories}
          onAddToCart={addToCart}
          merchantName={merchantName}
          cashierName={cashierName}
        />
      </div>

      {/* Right side - Cart (desktop only) */}
      <div className="hidden w-[380px] flex-col border-l bg-white shadow-lg md:flex">
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

      {/* Mobile: Floating cart button */}
      {totalItemCount > 0 && (
        <button
          onClick={() => setMobileCartOpen(true)}
          className="fixed bottom-5 left-4 right-4 z-40 flex items-center justify-between rounded-2xl bg-indigo-600 px-5 py-4 text-white shadow-xl shadow-indigo-600/30 active:scale-[0.98] md:hidden"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
                {totalItemCount}
              </span>
            </div>
            <span className="text-base font-semibold">View Cart</span>
          </div>
          <span className="text-base font-bold">{formatCurrency(total)}</span>
        </button>
      )}

      {/* Mobile: Bottom sheet backdrop */}
      {mobileCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMobileCartOpen(false)}
        />
      )}

      {/* Mobile: Bottom sheet cart */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[75vh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          mobileCartOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Sheet handle + close */}
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
            {totalItemCount > 0 && (
              <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-indigo-100 px-1.5 text-xs font-bold text-indigo-700">
                {totalItemCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setMobileCartOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sheet body - scrollable cart panel */}
        <div className="flex-1 overflow-y-auto">
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
            hideHeader
          />
        </div>
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
