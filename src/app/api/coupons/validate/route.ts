import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, subtotal } = (await req.json()) as {
      code: string;
      subtotal: number;
    };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId;

    const coupon = await db.coupon.findUnique({
      where: {
        code_tenantId: { code: code.toUpperCase(), tenantId },
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    if (coupon.minOrder && subtotal < coupon.minOrder) {
      const minFormatted = (coupon.minOrder / 100).toFixed(2);
      return NextResponse.json(
        {
          error: `Minimum order of $${minFormatted} required for this coupon`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
    });
  } catch (error: any) {
    console.error("[COUPON_VALIDATE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
