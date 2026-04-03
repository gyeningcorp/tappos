/**
 * WebAuthn Registration
 * GET  → generate registration options + store challenge in DB
 * POST → verify response + save credential
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { RP_NAME, RP_ID, ORIGIN } from "@/lib/webauthn";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { authenticators: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    attestationType: "none",
    excludeCredentials: user.authenticators.map((a) => ({
      id: a.credentialID,
      transports: a.transports
        ? (JSON.parse(a.transports) as AuthenticatorTransport[])
        : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform", // Face ID / Touch ID / Windows Hello only
    },
  });

  // Store challenge in DB for verification step
  await db.user.update({
    where: { id: user.id },
    data: { webauthnChallenge: options.challenge },
  });

  return NextResponse.json(options);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user?.webauthnChallenge) {
    return NextResponse.json({ error: "No challenge pending. Request options first." }, { status: 400 });
  }

  const body = await req.json();

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: user.webauthnChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;

  // Save credential + clear challenge
  await db.$transaction([
    db.authenticator.create({
      data: {
        userId: user.id,
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: BigInt(credential.counter),
        credentialDeviceType: verification.registrationInfo.credentialDeviceType,
        credentialBackedUp: verification.registrationInfo.credentialBackedUp,
        transports: body.response?.transports ? JSON.stringify(body.response.transports) : null,
      },
    }),
    db.user.update({
      where: { id: user.id },
      data: { webauthnChallenge: null },
    }),
  ]);

  return NextResponse.json({ verified: true });
}
