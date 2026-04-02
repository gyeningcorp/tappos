import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

const partnerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  phone: z.string().min(7, "Phone number is required"),
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  const suffix = Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `${prefix}-${suffix}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, companyName, phone } =
      partnerSchema.parse(body);

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Generate a unique referral code
    let referralCode = generateReferralCode();
    let codeExists = await db.partner.findUnique({
      where: { referralCode },
    });
    while (codeExists) {
      referralCode = generateReferralCode();
      codeExists = await db.partner.findUnique({
        where: { referralCode },
      });
    }

    // Create user first, then partner
    const user = await db.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "PARTNER",
      },
    });

    let partner;
    try {
      partner = await db.partner.create({
        data: {
          userId: user.id,
          companyName,
          phone,
          referralCode,
        },
      });
    } catch (partnerError) {
      await db.user.delete({ where: { id: user.id } }).catch(() => {});
      throw partnerError;
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        partner: {
          id: partner.id,
          referralCode: partner.referralCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Partner registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
