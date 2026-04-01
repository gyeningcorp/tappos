import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const order = await db.order.findFirst({
      where: {
        id: params.orderId,
        tenantId: session.user.tenantId,
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, image: true } },
            variant: { select: { id: true, name: true, type: true } },
          },
        },
        coupon: { select: { id: true, code: true, type: true, value: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error("[ORDER_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
