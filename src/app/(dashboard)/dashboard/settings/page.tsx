import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await requireAuth();

  const tenant = await db.tenant.findUnique({
    where: { id: user.tenantId },
  });

  if (!tenant) {
    redirect("/login");
  }

  const staff = await db.user.findMany({
    where: { tenantId: user.tenantId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      <SettingsClient
        tenant={{
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan.toLowerCase() as "starter" | "pro" | "enterprise",
          isActive: tenant.isActive,
        }}
        staff={staff.map((s) => ({
          id: s.id,
          email: s.email,
          name: s.name,
          role: s.role,
          createdAt: s.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
        isOwner={user.role === "OWNER"}
      />
    </div>
  );
}
