import { NextResponse } from "next/server";

// Socket.IO requires a custom server setup in Next.js App Router
// This endpoint serves as a health check for the socket connection
// The actual Socket.IO server is initialized in server.ts for production
export async function GET() {
  return NextResponse.json({ status: "Socket.IO endpoint ready" });
}
