import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import type { Plan } from "@prisma/client";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.metadata?.tenantId;
        const plan = session.metadata?.plan as Plan | undefined;

        if (tenantId && session.subscription) {
          await db.tenant.update({
            where: { id: tenantId },
            data: {
              subscriptionId: session.subscription as string,
              stripeCustomerId: session.customer as string,
              plan: plan ?? "STARTER",
              onboardingStep: 1,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;
        const plan = subscription.metadata?.plan as Plan | undefined;

        if (tenantId) {
          const updateData: Record<string, unknown> = {};

          if (plan) {
            updateData.plan = plan;
          }

          if (subscription.status === "active") {
            updateData.isActive = true;
          }

          if (Object.keys(updateData).length > 0) {
            await db.tenant.update({
              where: { id: tenantId },
              data: updateData,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          await db.tenant.update({
            where: { id: tenantId },
            data: {
              plan: "STARTER",
              subscriptionId: null,
              isActive: false,
            },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (customerId) {
          const tenant = await db.tenant.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (tenant) {
            console.error(
              `Payment failed for tenant ${tenant.id} (${tenant.name}). ` +
                `Invoice: ${invoice.id}`
            );
            // In production, you would send an email notification here
          }
        }
        break;
      }

      default:
        // Unhandled event type
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
