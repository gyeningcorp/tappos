"use client";

import { useState } from "react";
import {
  CreditCard,
  Banknote,
  CheckCircle2,
  Loader2,
  Printer,
  Mail,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Receipt } from "@/components/pos/receipt";
import type { CartItem, CouponData, OrderResult } from "@/components/pos/pos-terminal";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  method: "CARD" | "CASH";
  cart: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  coupon: CouponData | null;
  tenantId: string;
  onComplete: () => void;
}

export function PaymentDialog({
  open,
  onOpenChange,
  method,
  cart,
  subtotal,
  discount,
  tax,
  total,
  coupon,
  tenantId,
  onComplete,
}: PaymentDialogProps) {
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const cashAmount = Math.round(parseFloat(cashReceived || "0") * 100);
  const change = method === "CASH" ? Math.max(0, cashAmount - total) : 0;
  const cashValid = method === "CASH" ? cashAmount >= total : true;

  const quickCashAmounts = [
    total,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 2000) * 2000,
  ];
  // Remove duplicates and keep only sensible amounts
  const uniqueQuickAmounts = [...new Set(quickCashAmounts)]
    .filter((a) => a >= total)
    .slice(0, 4);

  const handleSubmit = async () => {
    setError("");
    setStep("processing");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          paymentMethod: method,
          couponCode: coupon?.code ?? null,
          cashReceived: method === "CASH" ? cashAmount : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      setOrder(data.order);
      setStep("success");
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onComplete();
    }
    setStep("input");
    setCashReceived("");
    setError("");
    setOrder(null);
    setShowReceipt(false);
    onOpenChange(false);
  };

  const handlePrintReceipt = () => {
    setShowReceipt(true);
    setTimeout(() => {
      window.print();
      setShowReceipt(false);
    }, 200);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {step === "success" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Payment Successful
                </>
              ) : method === "CARD" ? (
                <>
                  <CreditCard className="h-5 w-5 text-indigo-500" />
                  Card Payment
                </>
              ) : (
                <>
                  <Banknote className="h-5 w-5 text-emerald-500" />
                  Cash Payment
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {step === "success"
                ? `Order ${order?.orderNumber} has been placed.`
                : method === "CARD"
                  ? "Process card payment for this order."
                  : "Enter the cash amount received."}
            </DialogDescription>
          </DialogHeader>

          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">Processing payment...</p>
            </div>
          )}

          {step === "input" && (
            <div className="space-y-4">
              {/* Total display */}
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">Total Due</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(total)}
                </p>
              </div>

              {/* Cash input */}
              {method === "CASH" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Cash Received
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="h-14 pl-7 text-2xl font-bold"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Quick cash buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {uniqueQuickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        className="h-12 text-sm font-medium"
                        onClick={() =>
                          setCashReceived((amount / 100).toFixed(2))
                        }
                      >
                        {formatCurrency(amount)}
                      </Button>
                    ))}
                  </div>

                  {/* Change display */}
                  {cashAmount > 0 && (
                    <div
                      className={`rounded-xl p-3 text-center ${
                        cashValid
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {cashValid ? (
                        <>
                          <p className="text-xs font-medium">Change Due</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(change)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium">
                          Insufficient amount
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <Button
                className="h-14 w-full gap-2 text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSubmit}
                disabled={!cashValid}
              >
                {method === "CARD" ? (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Process Card Payment
                  </>
                ) : (
                  <>
                    <Banknote className="h-5 w-5" />
                    Complete Cash Payment
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "success" && order && (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-sm font-medium text-emerald-600">
                  Order Total
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {formatCurrency(order.total)}
                </p>
                {order.changeGiven != null && order.changeGiven > 0 && (
                  <p className="mt-1 text-sm text-emerald-600">
                    Change: {formatCurrency(order.changeGiven)}
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-gray-500">Order Number</p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  {order.orderNumber}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex-1 gap-2"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </Button>
                <Button variant="outline" className="h-12 flex-1 gap-2">
                  <Mail className="h-4 w-4" />
                  Email Receipt
                </Button>
              </div>

              <Button
                className="h-14 w-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700"
                onClick={handleClose}
              >
                New Order
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden printable receipt */}
      {showReceipt && order && (
        <div className="fixed inset-0 z-[9999] bg-white print:block hidden">
          <Receipt order={order} />
        </div>
      )}
    </>
  );
}
