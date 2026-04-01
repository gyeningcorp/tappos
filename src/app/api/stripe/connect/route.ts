export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
    }

    const tenant = await db.tenant.findUnique({
      where: { id: user.tenantId },
    });

    if (!tenant) {
      return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL!));
    }

    const baseUrl = process.env.NEXTAUTH_URL!;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
      scope: "read_write",
      redirect_uri: `${baseUrl}/api/stripe/connect/callback`,
      state: tenant.id,
      "stripe_user[business_type]": "company",
      "stripe_user[email]": user.email,
    });

    const connectUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    return NextResponse.redirect(connectUrl);
  } catch (error) {
    console.error("Stripe Connect error:", error);
    return NextResponse.redirect(
      new URL("/onboarding?error=connect_failed", process.env.NEXTAUTH_URL!)
    );
  }
}
