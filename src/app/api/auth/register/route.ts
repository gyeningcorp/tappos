import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth-utils";

const registerSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, email, password } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Generate a unique slug
    let slug = slugify(businessName);
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const passwordHash = await hashPassword(password);

    // Create tenant and owner user in a transaction
    const result = await db.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: businessName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "OWNER",
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          tenantId: result.tenant.id,
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

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
