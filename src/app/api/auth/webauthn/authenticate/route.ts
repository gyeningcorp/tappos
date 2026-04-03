/**
 * WebAuthn Authentication — POST with action field
 * action="options" → generate challenge (stored in DB)
 * action="verify"  → verify biometric response → set session cookie
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { RP_ID, ORIGIN } from "@/lib/webauthn";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: "options" | "verify";
    email: string;
    response?: unknown;
  };

  // ── Step 1: Generate challenge ──────────────────────────────────────
  if (body.action === "options") {
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const user = await db.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user || user.authenticators.length === 0) {
      return NextResponse.json(
        { error: "No passkey registered for this account" },
        { status: 404 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: "preferred",
      allowCredentials: user.authenticators.map((a) => ({
        id: a.credentialID,
        transports: a.transports
          ? (JSON.parse(a.transports) as AuthenticatorTransport[])
          : undefined,
      })),
    });

    // Store challenge in DB
    await db.user.update({
      where: { email },
      data: { webauthnChallenge: options.challenge },
    });

    return NextResponse.json(options);
  }

  // ── Step 2: Verify biometric response ──────────────────────────────
  if (body.action === "verify") {
    const { email, response } = body;
    if (!email || !response) {
      return NextResponse.json({ error: "Email and response required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
      include: { authenticators: true },
    });

    if (!user?.webauthnChallenge) {
      return NextResponse.json(
        { error: "No pending challenge. Request options first." },
        { status: 400 }
      );
    }

    const authResp = response as { id: string };
    const authenticator = user.authenticators.find((a) => a.credentialID === authResp.id);
    if (!authenticator) {
      return NextResponse.json({ error: "Credential not registered" }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: response as Parameters<typeof verifyAuthenticationResponse>[0]["response"],
        expectedChallenge: user.webauthnChallenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: authenticator.credentialID,
          publicKey: Buffer.from(authenticator.credentialPublicKey, "base64url"),
          counter: Number(authenticator.counter),
          transports: authenticator.transports
            ? (JSON.parse(authenticator.transports) as AuthenticatorTransport[])
            : undefined,
        },
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "Biometric verification failed" }, { status: 400 });
    }

    // Update counter + clear challenge
    await db.$transaction([
      db.authenticator.update({
        where: { credentialID: authenticator.credentialID },
        data: { counter: BigInt(verification.authenticationInfo.newCounter) },
      }),
      db.user.update({
        where: { id: user.id },
        data: { webauthnChallenge: null },
      }),
    ]);

    // Mint a NextAuth JWT session token
    const secret = process.env.NEXTAUTH_SECRET!;
    const token = await encode({
      token: {
        sub: user.id,
        id: user.id,
        email: user.email,
        name: user.name ?? "",
        role: user.role,
        tenantId: user.tenantId ?? "",
        picture: user.image ?? null,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const res = NextResponse.json({ verified: true });
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
