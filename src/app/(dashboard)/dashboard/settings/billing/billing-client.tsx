"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLAN_DETAILS, type PlanKey } from "@/lib/plans";

interface BillingClientProps {
  currentPlan: PlanKey;
}

export function BillingClient({ currentPlan }: BillingClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const planOrder: PlanKey[] = ["starter", "pro", "enterprise"];

  async function handleChangePlan(plan: PlanKey) {
    setLoading(plan);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Current Plan</h2>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-indigo-600">
            {PLAN_DETAILS[currentPlan].name}
          </span>
          <Badge className="bg-indigo-100 text-indigo-700">
            ${PLAN_DETAILS[currentPlan].price}/mo
          </Badge>
        </div>
        <Button
          onClick={handleManageBilling}
          disabled={portalLoading}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {portalLoading ? "Loading..." : "Manage Billing"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Card>

      <Separator />

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Compare Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map((key) => {
            const plan = PLAN_DETAILS[key];
            const isCurrent = key === currentPlan;
            const currentIdx = planOrder.indexOf(currentPlan);
            const planIdx = planOrder.indexOf(key);
            const isUpgrade = planIdx > currentIdx;

            return (
              <Card
                key={key}
                className={`relative flex flex-col p-6 border-2 ${
                  isCurrent
                    ? "border-indigo-600 shadow-lg shadow-indigo-100"
                    : "border-gray-200"
                }`}
              >
                {isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                )}
                {key === "pro" && !isCurrent && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1">
                    Popular
                  </Badge>
                )}

                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleChangePlan(key)}
                    disabled={loading !== null}
                    className={`w-full ${
                      isUpgrade
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                        : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    }`}
                    variant={isUpgrade ? "default" : "outline"}
                  >
                    {loading === key
                      ? "Loading..."
                      : isUpgrade
                      ? "Upgrade"
                      : "Downgrade"}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
