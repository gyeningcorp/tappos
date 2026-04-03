"use client";

/**
 * FaceIDButton — handles both registration and authentication flows
 * mode="register" → registers a new passkey (must be logged in)
 * mode="login"    → prompts biometric and signs in
 */
import { useState } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";
import { Scan, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  mode: "register" | "login";
  email?: string; // required for login mode
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export function FaceIDButton({ mode, email, onSuccess, onError }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegister() {
    setLoading(true);
    setStatus(null);
    try {
      // 1. Get registration options from server
      const optRes = await fetch("/api/auth/webauthn/register");
      if (!optRes.ok) throw new Error(await optRes.text());
      const options = await optRes.json();

      // 2. Prompt browser biometric (Face ID / Touch ID / Windows Hello)
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Send credential to server for verification
      const verRes = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verRes.json();
      if (!verRes.ok) throw new Error(result.error);

      setStatus("✅ Face ID registered!");
      onSuccess?.();
    } catch (err: any) {
      const msg = err.message || "Registration failed";
      setStatus(`❌ ${msg}`);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!email) {
      onError?.("Enter your email first");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      // 1. Get authentication options
      const optRes = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "options", email }),
      });
      if (!optRes.ok) {
        const err = await optRes.json();
        throw new Error(err.error);
      }
      const options = await optRes.json();

      // 2. Prompt biometric
      const credential = await startAuthentication({ optionsJSON: options });

      // 3. Verify + get session cookie
      const verRes = await fetch("/api/auth/webauthn/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, response: credential }),
      });
      const result = await verRes.json();
      if (!verRes.ok) throw new Error(result.error);

      setStatus("✅ Authenticated!");
      onSuccess?.();
      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      const msg = err.message || "Authentication failed";
      setStatus(`❌ ${msg}`);
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  }

  const isSupported =
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined;

  if (!isSupported) return null;

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-slate-300 hover:bg-slate-50"
        onClick={mode === "register" ? handleRegister : handleLogin}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Scan className="h-4 w-4" />
        )}
        {loading
          ? "Checking biometrics…"
          : mode === "register"
          ? "Register Face ID / Fingerprint"
          : "Sign in with Face ID"}
      </Button>
      {status && (
        <p className="text-center text-xs text-slate-500">{status}</p>
      )}
    </div>
  );
}
