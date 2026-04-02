import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const count = await db.tenant.count();
    return NextResponse.json({ ok: true, tenantCount: count, dbUrl: process.env.DATABASE_URL?.substring(0, 40) + "..." });
  } catch (error: unknown) {
    const e = error as Error;
    return NextResponse.json({ ok: false, error: e.message, stack: e.stack?.substring(0, 500) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const slug = `test-${Date.now()}`;
    const tenant = await db.tenant.create({ data: { name: "Debug Test", slug } });
    const user = await db.user.create({
      data: {
        email: `debug-${Date.now()}@test.com`,
        passwordHash: "testhash",
        role: "OWNER",
        tenantId: tenant.id,
      },
    });
    await db.user.delete({ where: { id: user.id } });
    await db.tenant.delete({ where: { id: tenant.id } });
    return NextResponse.json({ ok: true, message: "DB write/delete cycle succeeded" });
  } catch (error: unknown) {
    const e = error as Error;
    return NextResponse.json({ ok: false, error: e.message, code: (e as NodeJS.ErrnoException).code }, { status: 500 });
  }
}
