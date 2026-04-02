import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { generateOrderNumber } from "@/lib/utils";

const TAX_RATE = 0.08875;

interface OrderItemInput {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { items, paymentMethod, couponCode, cashReceived } =
      (await req.json()) as {
        items: OrderItemInput[];
        paymentMethod: "CARD" | "CASH";
        couponCode: string | null;
        cashReceived: number | null;
      };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Order must have at least one item" },
        { status: 400 }
      );
    }

    if (!["CARD", "CASH"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    const tenantId = session.user.tenantId;
  if (!tenantId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const userId = session.user.id;

    // Validate stock for all items
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await db.product.findMany({
      where: { id: { in: productIds }, tenantId },
      include: { variants: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.name}` },
          { status: 400 }
        );
      }

      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          return NextResponse.json(
            { error: `Variant not found for ${item.name}` },
            { status: 400 }
          );
        }
        if (variant.stock < item.quantity) {
          return NextResponse.json(
            {
              error: `Insufficient stock for ${item.name} (available: ${variant.stock})`,
            },
            { status: 400 }
          );
        }
      } else if (product.trackStock && product.stock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.name} (available: ${product.stock})`,
          },
          { status: 400 }
        );
      }
    }

    // Calculate totals
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Validate and apply coupon
    let discount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code_tenantId: { code: couponCode, tenantId } },
      });

      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minOrder || subtotal >= coupon.minOrder)
      ) {
        couponId = coupon.id;
        discount =
          coupon.type === "PERCENTAGE"
            ? Math.round(subtotal * (coupon.value / 100))
            : Math.min(coupon.value, subtotal);
      }
    }

    const taxableAmount = subtotal - discount;
    const tax = Math.round(taxableAmount * TAX_RATE);
    const total = taxableAmount + tax;

    // For cash payment, validate cash received
    if (paymentMethod === "CASH") {
      if (cashReceived == null || cashReceived < total) {
        return NextResponse.json(
          { error: "Insufficient cash received" },
          { status: 400 }
        );
      }
    }

    // Process Stripe payment if card
    let stripePaymentId: string | null = null;

    if (paymentMethod === "CARD") {
      const tenant = await db.tenant.findUnique({
        where: { id: tenantId },
        select: { stripeAccountId: true },
      });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        payment_method_types: ["card_present"],
        capture_method: "automatic",
        ...(tenant?.stripeAccountId
          ? { transfer_data: { destination: tenant.stripeAccountId } }
          : {}),
        metadata: {
          tenantId,
          userId,
        },
      });

      stripePaymentId = paymentIntent.id;
    }

    // Create order in a transaction
    const changeGiven =
      paymentMethod === "CASH" && cashReceived != null
        ? cashReceived - total
        : null;

    const order = await db.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          status: "COMPLETED",
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          stripePaymentId,
          cashReceived: paymentMethod === "CASH" ? cashReceived : null,
          changeGiven,
          tenantId,
          userId,
          couponId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Decrement stock
      for (const item of items) {
        if (item.variantId) {
          await tx.variant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          const product = productMap.get(item.productId);
          if (product?.trackStock) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    return NextResponse.json({
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.paymentMethod,
        cashReceived: order.cashReceived,
        changeGiven: order.changeGiven,
        items: order.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        createdAt: order.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[ORDERS_POST]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
