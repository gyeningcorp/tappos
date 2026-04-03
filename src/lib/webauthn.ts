/**
 * WebAuthn / Passkey helpers
 * Wraps @simplewebauthn/server for Face ID, Touch ID, Windows Hello
 */

export const RP_NAME = "TapPOS";
export const RP_ID =
  process.env.NODE_ENV === "production"
    ? "tappos.vercel.app"
    : "localhost";
export const ORIGIN =
  process.env.NODE_ENV === "production"
    ? "https://tappos.vercel.app"
    : "http://localhost:3000";
