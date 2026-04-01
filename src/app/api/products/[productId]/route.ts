import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await db.product.findFirst({
      where: {
        id: params.productId,
        tenantId: user.tenantId,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership
    const existing = await db.product.findFirst({
      where: { id: params.productId, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      price,
      sku,
      barcode,
      categoryId,
      stock,
      lowStockAt,
      trackStock,
      isActive,
      variants,
    } = body;

    // Delete existing variants and recreate
    await db.variant.deleteMany({
      where: { productId: params.productId },
    });

    const product = await db.product.update({
      where: { id: params.productId },
      data: {
        name,
        description: description || null,
        price: Math.round(price),
        sku: sku || null,
        barcode: barcode || null,
        categoryId: categoryId || null,
        stock: stock ?? 0,
        lowStockAt: lowStockAt ?? 5,
        trackStock: trackStock ?? true,
        isActive: isActive ?? true,
        variants: variants?.length
          ? {
              create: variants.map(
                (v: {
                  name: string;
                  type: string;
                  price?: number;
                  stock?: number;
                  sku?: string;
                }) => ({
                  name: v.name,
                  type: v.type,
                  price: v.price != null ? Math.round(v.price) : null,
                  stock: v.stock ?? 0,
                  sku: v.sku || null,
                })
              ),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: true,
      },
    });

    // Check if low stock alert needed
    if (product.trackStock && product.stock <= product.lowStockAt) {
      const existingAlert = await db.inventoryAlert.findFirst({
        where: {
          productId: product.id,
          tenantId: user.tenantId,
          isRead: false,
        },
      });

      if (!existingAlert) {
        await db.inventoryAlert.create({
          data: {
            productName: product.name,
            productId: product.id,
            currentStock: product.stock,
            threshold: product.lowStockAt,
            tenantId: user.tenantId,
          },
        });
      }
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.product.findFirst({
      where: { id: params.productId, tenantId: user.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await db.product.delete({
      where: { id: params.productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
