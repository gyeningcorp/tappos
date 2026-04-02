"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut, Users, DollarSign, TrendingUp, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Stats {
  totalMerchants: number;
  activeMerchants: number;
  monthlyCommission: number;
  lifetimeEarnings: number;
  referralCode: string;
  commissionRate: number;
}

interface Merchant {
  id: string;
  name: string;
  plan: string;
  isActive: boolean;
  signupDate: string;
  monthlyContribution: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PartnerDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "PARTNER") {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/partners/stats").then((r) => r.json()),
        fetch("/api/partners/merchants").then((r) => r.json()),
      ])
        .then(([statsData, merchantsData]) => {
          setStats(statsData);
          setMerchants(merchantsData.merchants || []);
        })
        .finally(() => setLoading(false));
    }
  }, [status, session, router]);

  function copyReferralLink() {
    if (!stats) return;
    const link = `https://tappos.vercel.app/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Unable to load partner data.</p>
      </div>
    );
  }

  const referralLink = `https://tappos.vercel.app/register?ref=${stats.referralCode}`;

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">TapPOS</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Partner
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session?.user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <p className="text-muted-foreground">
            Track your referrals and commissions
          </p>
        </div>

        {/* Referral Link Widget */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Referral Link</CardTitle>
            <CardDescription>
              Share this link with merchants to earn {stats.commissionRate}%
              commission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono truncate">
                {referralLink}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReferralLink}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Referral code: <strong>{stats.referralCode}</strong>
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Merchants
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMerchants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Merchants
              </CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMerchants}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Monthly Commission
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCents(stats.monthlyCommission)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Lifetime Earnings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCents(stats.lifetimeEarnings)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Merchants Table */}
        <Card>
          <CardHeader>
            <CardTitle>Referred Merchants</CardTitle>
            <CardDescription>
              Merchants who signed up with your referral code
            </CardDescription>
          </CardHeader>
          <CardContent>
            {merchants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No merchants referred yet. Share your referral link to get
                started!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Name</th>
                      <th className="text-left py-3 px-2 font-medium">
                        Signup Date
                      </th>
                      <th className="text-left py-3 px-2 font-medium">Plan</th>
                      <th className="text-left py-3 px-2 font-medium">
                        Status
                      </th>
                      <th className="text-right py-3 px-2 font-medium">
                        Monthly Commission
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="py-3 px-2 font-medium">{m.name}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {new Date(m.signupDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {m.plan}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {m.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCents(m.monthlyContribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
