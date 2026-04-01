import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const user = await requireAuth();

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) {
    redirect("/login");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
      <p className="text-gray-500 mb-8">Manage your subscription and billing details.</p>
      <BillingClient
        currentPlan={tenant.plan.toLowerCase() as "starter" | "pro" | "enterprise"}
      />
    </div>
  );
}
