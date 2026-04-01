import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { step, activate, businessName } = body;

    const updateData: Record<string, unknown> = {};

    if (typeof step === "number" && step >= 0 && step <= 4) {
      updateData.onboardingStep = step;
    }

    if (typeof businessName === "string" && businessName.trim().length >= 2) {
      updateData.name = businessName.trim();
    }

    if (activate === true) {
      updateData.isActive = true;
      updateData.onboardingStep = 4;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const tenant = await db.tenant.update({
      where: { id: user.tenantId },
      data: updateData,
    });

    return NextResponse.json({
      tenant: {
        id: tenant.id,
        onboardingStep: tenant.onboardingStep,
        isActive: tenant.isActive,
        name: tenant.name,
      },
    });
  } catch (error) {
    console.error("Onboarding update error:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding" },
      { status: 500 }
    );
  }
}
