import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { OnboardingWizard } from "./onboarding-wizard";

export default async function OnboardingPage() {
  const user = await requireAuth();

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) {
    redirect("/login");
  }

  if (tenant.isActive && tenant.onboardingStep >= 4) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Set Up Your POS
          </h1>
          <p className="text-gray-500 mt-2">
            Complete these steps to get your business up and running.
          </p>
        </div>
        <OnboardingWizard
          tenantId={tenant.id}
          tenantName={tenant.name}
          initialStep={tenant.onboardingStep}
          currentPlan={(tenant.plan.toLowerCase() as "starter" | "pro" | "enterprise")}
          hasStripe={!!tenant.stripeAccountId}
        />
      </div>
    </div>
  );
}
