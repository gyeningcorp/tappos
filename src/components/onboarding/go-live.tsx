'use client'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface GoLiveProps {
  tenantName: string;
  plan: string;
  hasStripe: boolean;
}

export function GoLive({ tenantName, plan, hasStripe }: GoLiveProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoLive() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 4, activate: true }),
      });

      if (!res.ok) {
        throw new Error("Failed to activate");
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const checks = [
    { label: `Business: ${tenantName}`, done: true },
    { label: `Plan: ${plan}`, done: true },
    { label: "Stripe connected", done: hasStripe },
  ];

  return (
    <Card className="max-w-lg mx-auto p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
          <Rocket className="h-8 w-8 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Ready to Go Live!
        </h3>
        <p className="text-gray-500">
          Everything looks good. Review your setup and launch your POS.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {checks.map((check) => (
          <div
            key={check.label}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
          >
            <CheckCircle2
              className={`h-5 w-5 shrink-0 ${
                check.done ? "text-green-600" : "text-gray-300"
              }`}
            />
            <span className="text-sm text-gray-700">{check.label}</span>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-4 text-center">{error}</p>}

      <Button
        onClick={handleGoLive}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg py-6"
      >
        {loading ? "Activating..." : "Go Live"}
      </Button>
    </Card>
  );
}
