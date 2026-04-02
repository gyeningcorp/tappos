import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await db.partner.findUnique({
      where: { userId: user.id },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Partner not found" },
        { status: 404 }
      );
    }

    const allReferred = await db.tenant.findMany({
      where: { referredByCode: partner.referralCode },
      select: {
        id: true,
        isActive: true,
        plan: true,
        createdAt: true,
      },
    });

    const totalMerchants = allReferred.length;
    const activeMerchants = allReferred.filter((t) => t.isActive).length;

    // Commission calculation based on plan pricing
    const planPricing: Record<string, number> = {
      STARTER: 2900,
      PRO: 7900,
      ENTERPRISE: 19900,
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const activeReferred = allReferred.filter((t) => t.isActive);
    const monthlyReferred = activeReferred.filter(
      (t) => t.createdAt <= startOfMonth || t.createdAt <= now
    );

    const commissionRate = Number(partner.commissionRate) / 100;

    const monthlyCommission = monthlyReferred.reduce((sum, t) => {
      const planPrice = planPricing[t.plan] || 0;
      return sum + Math.round(planPrice * commissionRate);
    }, 0);

    const lifetimeEarnings = activeReferred.reduce((sum, t) => {
      const planPrice = planPricing[t.plan] || 0;
      const months =
        Math.max(
          1,
          (now.getFullYear() - t.createdAt.getFullYear()) * 12 +
            (now.getMonth() - t.createdAt.getMonth()) +
            1
        );
      return sum + Math.round(planPrice * commissionRate * months);
    }, 0);

    return NextResponse.json({
      totalMerchants,
      activeMerchants,
      monthlyCommission,
      lifetimeEarnings,
      referralCode: partner.referralCode,
      commissionRate: Number(partner.commissionRate),
    });
  } catch (error) {
    console.error("Partner stats error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
