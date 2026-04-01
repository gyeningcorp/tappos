import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.category.findFirst({
      where: { id: params.categoryId, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { name, color, sortOrder } = body;

    const category = await db.category.update({
      where: { id: params.categoryId },
      data: {
        name,
        color: color || "#6366f1",
        sortOrder: sortOrder ?? 0,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.category.findFirst({
      where: { id: params.categoryId, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await db.category.delete({
      where: { id: params.categoryId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
