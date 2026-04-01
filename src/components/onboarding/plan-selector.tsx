"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_DETAILS, type PlanKey } from "@/lib/plans";

interface PlanSelectorProps {
  currentPlan?: PlanKey;
  onSelect: (plan: PlanKey) => void;
  loading?: boolean;
}

export function PlanSelector({ currentPlan, onSelect, loading }: PlanSelectorProps) {
  const [selected, setSelected] = useState<PlanKey | null>(currentPlan ?? null);

  const plans: { key: PlanKey; popular?: boolean }[] = [
    { key: "starter" },
    { key: "pro", popular: true },
    { key: "enterprise" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map(({ key, popular }) => {
        const plan = PLAN_DETAILS[key];
        const isSelected = selected === key;

        return (
          <Card
            key={key}
            className={`relative flex flex-col p-6 rounded-xl border-2 transition-all ${
              isSelected
                ? "border-indigo-600 shadow-lg shadow-indigo-100"
                : "border-gray-200 hover:border-indigo-300"
            } ${popular ? "scale-[1.02]" : ""}`}
          >
            {popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-3 py-1">
                Popular
              </Badge>
            )}

            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <div className="mt-3">
                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                <span className="text-gray-500 ml-1">/mo</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              onClick={() => {
                setSelected(key);
                onSelect(key);
              }}
              disabled={loading}
              variant={isSelected ? "default" : "outline"}
              className={`w-full ${
                isSelected
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {isSelected ? "Selected" : "Select Plan"}
            </Button>
          </Card>
        );
      })}
    </div>
  );
}
