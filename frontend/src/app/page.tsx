/* frontend/src/app/page.tsx */
"use client";

import React, { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null);
    try {
      if (!email.trim() || !password) throw new Error("Email and password are required");
      await api.auth.login(email.trim(), password);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    // Do NOT set a background here. Body already has the global gradient.
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-[560px] sm:w-[600px] md:w-[640px] lg:w-[520px] max-w-[95vw]">
        {/* Logos from /public/images */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <img src="/images/covenant-logo-white.png" alt="Covenant" className="h-11 w-auto" />
          <img src="/images/azor-logo-white.png" alt="Azor" className="h-12 w-auto" />
        </div>

        {/* Card */}
        <div className="card" style={{ borderRadius: 16 }}>
          <h1 className="text-2xl font-bold mb-2 text-center">Welcome back</h1>
          <p className="text-sm text-[var(--muted)] mb-4 text-center">Partner portal</p>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                className="input w-full"
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                className="input w-full"
                type="password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="•••••••••••••••"
              />
            </div>

            {err && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                {err}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button type="submit" disabled={busy} className="btn w-full">
                {busy ? "Signing in…" : "Sign in"}
              </button>
              <a href="/account" className="btn ghost w-full text-center">Reset password</a>
            </div>
          </form>
        </div>

        <div className="powered-by mt-3 text-center">powered by Covenant ✦ Azor</div>
      </div>
    </div>
  );
}
