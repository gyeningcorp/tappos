import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: Record<string, unknown> = {
      tenantId: user.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await db.product.findMany({
      where,
      include: {
        category: true,
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
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

    const product = await db.product.create({
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
        tenantId: user.tenantId,
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

    // Create low stock alert if applicable
    if (product.trackStock && product.stock <= product.lowStockAt) {
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

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
