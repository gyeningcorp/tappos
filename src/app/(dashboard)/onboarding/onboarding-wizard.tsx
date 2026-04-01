"use client";

import { useState } from "react";
import { PlanSelector } from "@/components/onboarding/plan-selector";
import { StripeConnect } from "@/components/onboarding/stripe-connect";
import { QuickProducts } from "@/components/onboarding/quick-products";
import { GoLive } from "@/components/onboarding/go-live";
import type { PlanKey } from "@/lib/plans";

interface OnboardingWizardProps {
  tenantId: string;
  tenantName: string;
  initialStep: number;
  currentPlan: PlanKey;
  hasStripe: boolean;
}

const STEPS = ["Choose Plan", "Connect Stripe", "Add Products", "Go Live"];

export function OnboardingWizard({
  tenantId,
  tenantName,
  initialStep,
  currentPlan,
  hasStripe,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(initialStep);
  const [plan, setPlan] = useState<PlanKey>(currentPlan);
  const [loading, setLoading] = useState(false);

  async function updateStep(newStep: number) {
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: newStep }),
      });
      if (res.ok) {
        setStep(newStep);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePlanSelect(selectedPlan: PlanKey) {
    setPlan(selectedPlan);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        await updateStep(1);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    i <= step
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    i <= step ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 mt-[-1rem] ${
                    i < step ? "bg-indigo-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 0 && (
        <PlanSelector
          currentPlan={plan}
          onSelect={handlePlanSelect}
          loading={loading}
        />
      )}

      {step === 1 && (
        <StripeConnect
          isConnected={hasStripe}
          onContinue={() => updateStep(2)}
        />
      )}

      {step === 2 && (
        <QuickProducts
          tenantId={tenantId}
          onContinue={() => updateStep(3)}
        />
      )}

      {step === 3 && (
        <GoLive
          tenantName={tenantName}
          plan={plan.charAt(0).toUpperCase() + plan.slice(1)}
          hasStripe={hasStripe}
        />
      )}
    </div>
  );
}
