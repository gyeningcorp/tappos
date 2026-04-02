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

    const merchants = await db.tenant.findMany({
      where: { referredByCode: partner.referralCode },
      select: {
        id: true,
        name: true,
        plan: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const planPricing: Record<string, number> = {
      STARTER: 2900,
      PRO: 7900,
      ENTERPRISE: 19900,
    };

    const commissionRate = Number(partner.commissionRate) / 100;

    const merchantList = merchants.map((m) => ({
      id: m.id,
      name: m.name,
      plan: m.plan,
      isActive: m.isActive,
      signupDate: m.createdAt.toISOString(),
      monthlyContribution: m.isActive
        ? Math.round((planPricing[m.plan] || 0) * commissionRate)
        : 0,
    }));

    return NextResponse.json({ merchants: merchantList });
  } catch (error) {
    console.error("Partner merchants error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
