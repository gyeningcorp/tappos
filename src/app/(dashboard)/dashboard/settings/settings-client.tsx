"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CreditCard, Users, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLAN_DETAILS } from "@/lib/plans";

interface SettingsClientProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: "starter" | "pro" | "enterprise";
    isActive: boolean;
  };
  staff: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  }[];
  currentUserId: string;
  isOwner: boolean;
}

export function SettingsClient({
  tenant,
  staff,
  currentUserId,
  isOwner,
}: SettingsClientProps) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(tenant.name);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("CASHIER");
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlan = PLAN_DETAILS[tenant.plan];

  async function handleSaveBusiness() {
    setSaving(true);
    try {
      await fetch("/api/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName }),
      });
      router.refresh();
    } finally {
      setSaving(false);
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
      {/* Business Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Business Information</h2>
        </div>
        <div className="grid gap-4 max-w-md">
          <div>
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div>
            <Label>Store URL</Label>
            <p className="text-sm text-gray-500 mt-1">{tenant.slug}.tappos.app</p>
          </div>
          <Button
            onClick={handleSaveBusiness}
            disabled={saving || businessName === tenant.name}
            className="w-fit bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </Card>

      {/* Current Plan */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{currentPlan.name}</span>
              <Badge className="bg-indigo-100 text-indigo-700">
                ${currentPlan.price}/mo
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {currentPlan.features.slice(0, 3).join(" - ")}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/settings/billing")}
          >
            Change Plan
          </Button>
          <Button
            onClick={handleManageBilling}
            disabled={portalLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {portalLoading ? "Loading..." : "Manage Billing"}
          </Button>
        </div>
      </Card>

      {/* Staff Management */}
      {isOwner && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Staff Management</h2>
          </div>

          <div className="space-y-3 mb-6">
            {staff.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {member.name || member.email}
                    {member.id === currentUserId && (
                      <span className="text-xs text-gray-400 ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    member.role === "OWNER"
                      ? "border-indigo-200 text-indigo-700"
                      : member.role === "MANAGER"
                      ? "border-amber-200 text-amber-700"
                      : "border-gray-200 text-gray-700"
                  }
                >
                  {member.role}
                </Badge>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <h3 className="text-sm font-medium text-gray-700 mb-3">Invite New Staff</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="email@example.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="CASHIER">Cashier</option>
              <option value="MANAGER">Manager</option>
            </select>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={!inviteEmail}
            >
              <Mail className="mr-2 h-4 w-4" /> Invite
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
