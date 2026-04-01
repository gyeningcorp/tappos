import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { stripe, PLANS, type PlanKey } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const plan = body.plan as PlanKey;

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL!;

    // Create or retrieve a Stripe customer
    let customerId = tenant.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          tenantId: tenant.id,
        },
      });
      customerId = customer.id;

      await db.tenant.update({
        where: { id: tenant.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create a Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: PLANS[plan].priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/onboarding?session_id={CHECKOUT_SESSION_ID}&step=1`,
      cancel_url: `${baseUrl}/onboarding?cancelled=true`,
      metadata: {
        tenantId: tenant.id,
        plan: plan.toUpperCase(),
      },
      subscription_data: {
        metadata: {
          tenantId: tenant.id,
          plan: plan.toUpperCase(),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
