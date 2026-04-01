import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { authOptions } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role as Role)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
