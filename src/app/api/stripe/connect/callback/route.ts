import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state"); // tenantId
    const errorParam = url.searchParams.get("error");

    const baseUrl = process.env.NEXTAUTH_URL!;

    if (errorParam) {
      return NextResponse.redirect(
        new URL(`/onboarding?error=${errorParam}`, baseUrl)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/onboarding?error=missing_params", baseUrl)
      );
    }

    // Exchange the authorization code for a connected account ID
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;

    if (!stripeAccountId) {
      return NextResponse.redirect(
        new URL("/onboarding?error=no_account", baseUrl)
      );
    }

    // Save the connected account ID to the tenant
    await db.tenant.update({
      where: { id: state },
      data: {
        stripeAccountId,
        onboardingStep: 2,
      },
    });

    return NextResponse.redirect(new URL("/onboarding", baseUrl));
  } catch (error) {
    console.error("Stripe Connect callback error:", error);
    return NextResponse.redirect(
      new URL("/onboarding?error=callback_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
