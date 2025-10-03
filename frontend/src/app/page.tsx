"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [needMfa, setNeedMfa] = useState(false);
  const [mfaEnroll, setMfaEnroll] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [mfaErr, setMfaErr] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  function copySecret() {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  function downloadRecoveryCodes() {
    if (!codes || codes.length === 0) return;
    const content = `Covenant Azor - Recovery Codes\n\nStore these codes safely. Each can be used once.\n\n${codes.join('\n')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'covenant-azor-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openEnroll() {
    setMfaErr(null);
    try {
      const out = await api.mfa.setup();
      setQr(out.qr || null);
      setSecret(out.secret || null);
      setCodes(out.recovery_codes || []);
      setMfaEnroll(true);
    } catch (e: any) {
      setMfaErr(errText(e));
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await api.auth.login(email.trim(), password);
      if (res?.mfa_enroll) {
        // User needs to enroll in MFA
        await openEnroll();
      } else if (res?.access_token) {
        // Login successful
        router.push("/dashboard");
      } else {
        setErr("Unexpected response from server.");
      }
    } catch (e: any) {
      const code = e?.response?.data?.code;
      if (code === "mfa_enrollment_required") {
        await openEnroll();
      } else if (code === "mfa_code_required") {
        // User has MFA enabled, show code prompt
        setNeedMfa(true);
      } else {
        setErr(errText(e));
      }
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyEnrollment(e: React.FormEvent) {
    e.preventDefault();
    if (mfaBusy) return;
    if (!mfaCode.trim()) return;
    setMfaBusy(true);
    setMfaErr(null);
    try {
      await api.mfa.verify(mfaCode.trim());
      // After enrollment verification, login with MFA code
      const res = await api.auth.login(email.trim(), password, mfaCode.trim());
      if (res?.access_token) {
        router.push("/dashboard");
      } else {
        setMfaErr("Login failed after MFA enrollment.");
      }
    } catch (e: any) {
      setMfaErr(errText(e));
    } finally {
      setMfaBusy(false);
    }
  }

  async function onVerifyMfaCode(e: React.FormEvent) {
    e.preventDefault();
    if (mfaBusy) return;
    if (!mfaCode.trim()) return;
    setMfaBusy(true);
    setMfaErr(null);
    try {
      const res = await api.auth.login(email.trim(), password, mfaCode.trim());
      if (res?.access_token) {
        router.push("/dashboard");
      } else {
        setMfaErr("Login failed.");
      }
    } catch (e: any) {
      setMfaErr(errText(e));
    } finally {
      setMfaBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-[520px] max-w-[95vw]">
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
            </div>
          </form>
        </div>
      </div>

      {needMfa && !mfaEnroll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[400px] max-w-[95vw] shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Enter MFA Code</h3>
              <button className="btn ghost" onClick={()=>setNeedMfa(false)}>Close</button>
            </div>
            {mfaErr && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mb-3">{mfaErr}</div>}
            <p className="text-sm text-[var(--muted)] mb-3">Enter the 6-digit code from your authenticator app.</p>
            <form onSubmit={onVerifyMfaCode} className="space-y-3">
              <input
                className="input w-full"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={mfaCode}
                onChange={(e)=>setMfaCode(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn w-full" disabled={mfaBusy}>
                {mfaBusy ? "Verifying…" : "Verify & Continue"}
              </button>
            </form>
          </div>
        </div>
      )}

      {mfaEnroll && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-[560px] max-w-[95vw] shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">Set up Multi‑Factor Authentication</h3>
              <button className="btn ghost" onClick={()=>setMfaEnroll(false)}>Close</button>
            </div>
            {mfaErr && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mb-3">{mfaErr}</div>}
            <ol className="space-y-3 text-sm">
              <li>1. Open an authenticator app (1Password, Microsoft/Google Authenticator, etc.).</li>
              <li className="grid grid-cols-2 gap-3">
                <div className="border rounded-md grid place-items-center h-[180px]">
                  {qr ? <img src={qr} alt="QR" className="max-h-[170px]" /> : <span>Loading QR…</span>}
                </div>
                <div className="border rounded-md p-2">
                  <div className="text-xs text-[var(--muted)] mb-1">Can't scan?</div>
                  <div className="text-xs">Enter this key manually (Base32 secret)</div>
                  <div className="mt-1 font-mono select-all break-all text-xs">{secret || "—"}</div>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="mt-2 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                  >
                    {copiedSecret ? "✓ Copied!" : "Copy Secret"}
                  </button>
                </div>
              </li>
              <li className="border rounded-md p-2 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-[var(--muted)]">Recovery codes (store safely)</div>
                  <button
                    type="button"
                    onClick={downloadRecoveryCodes}
                    className="text-xs px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1"
                    title="Download recovery codes"
                  >
                    <span className="text-[11px]">Download recovery codes</span>
                    <span>⬇</span>
                  </button>
                </div>
                <div className="font-mono text-xs whitespace-pre-wrap">{(codes || []).join("\n") || "Loading…"}</div>
              </li>
              <li>
                <form onSubmit={onVerifyEnrollment} className="flex gap-2 items-center">
                  <input
                    className="input flex-1"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={mfaCode}
                    onChange={(e)=>setMfaCode(e.target.value)}
                  />
                  <button type="submit" className="btn" disabled={mfaBusy}>
                    {mfaBusy ? "Verifying…" : "Verify & Continue"}
                  </button>
                </form>
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
