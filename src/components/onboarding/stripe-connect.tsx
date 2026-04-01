"use client";

import { useState } from "react";
import { CreditCard, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StripeConnectProps {
  isConnected: boolean;
  onContinue: () => void;
}

export function StripeConnect({ isConnected, onContinue }: StripeConnectProps) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      window.location.href = "/api/stripe/connect";
    } catch {
      setLoading(false);
    }
  }

  if (isConnected) {
    return (
      <Card className="max-w-lg mx-auto p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Stripe Account Connected
        </h3>
        <p className="text-gray-500 mb-6">
          Your Stripe account is linked. You can accept card payments and tap-to-pay.
        </p>
        <Button
          onClick={onContinue}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Continue
        </Button>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <CreditCard className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Stripe Account
        </h3>
        <p className="text-gray-500">
          TapPOS uses Stripe to process payments securely. Connect your Stripe
          account to start accepting card and tap-to-pay transactions.
        </p>
      </div>

      <div className="space-y-3 mb-8 text-sm text-gray-600">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <span>Accept credit cards, debit cards, and mobile wallets</span>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <span>Payouts deposited directly to your bank account</span>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <span>PCI-compliant, end-to-end encrypted transactions</span>
        </div>
      </div>

      <Button
        onClick={handleConnect}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {loading ? "Redirecting..." : "Connect Stripe Account"}
        <ExternalLink className="ml-2 h-4 w-4" />
      </Button>

      <p className="text-xs text-gray-400 text-center mt-4">
        You will be redirected to Stripe to complete the connection.
      </p>
    </Card>
  );
}
