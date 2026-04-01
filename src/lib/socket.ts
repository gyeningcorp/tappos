import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

let io: SocketIOServer | undefined;

export function getIO(): SocketIOServer | undefined {
  return io;
}

export function initSocketServer(server: NetServer): SocketIOServer {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-tenant", (tenantId: string) => {
      socket.join(`tenant:${tenantId}`);
      console.log(`Socket ${socket.id} joined tenant:${tenantId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
}

export function emitOrderUpdate(tenantId: string, order: unknown) {
  io?.to(`tenant:${tenantId}`).emit("order-update", order);
}

export function emitInventoryAlert(tenantId: string, alert: unknown) {
  io?.to(`tenant:${tenantId}`).emit("inventory-alert", alert);
}
