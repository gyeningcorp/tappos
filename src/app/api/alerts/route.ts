import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const alerts = await db.inventoryAlert.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { alertIds, action } = body;

    if (action === "markRead") {
      await db.inventoryAlert.updateMany({
        where: {
          id: { in: alertIds },
          tenantId: user.tenantId,
        },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true });
    }

    if (action === "dismiss") {
      await db.inventoryAlert.deleteMany({
        where: {
          id: { in: alertIds },
          tenantId: user.tenantId,
        },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update alerts:", error);
    return NextResponse.json(
      { error: "Failed to update alerts" },
      { status: 500 }
    );
  }
}
