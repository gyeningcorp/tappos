"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000", {
      path: "/api/socketio",
      addTrailingSlash: false,
    });
  }
  return socket;
}

export function joinTenant(tenantId: string) {
  const s = getSocket();
  s.emit("join-tenant", tenantId);
}

export function onOrderUpdate(callback: (order: unknown) => void) {
  const s = getSocket();
  s.on("order-update", callback);
  return () => {
    s.off("order-update", callback);
  };
}

export function onInventoryAlert(callback: (alert: unknown) => void) {
  const s = getSocket();
  s.on("inventory-alert", callback);
  return () => {
    s.off("inventory-alert", callback);
  };
}
