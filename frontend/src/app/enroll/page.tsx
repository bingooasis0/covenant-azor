
// frontend/src/app/enroll/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText } from "@/lib/api";

export default function EnrollPage() {
  const router = useRouter();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.mfa.setup();
        if (!cancelled) {
          setQr(data.qr);
          setSecret(data.secret || null);
        }
      } catch (e: any) {
        if (!cancelled) setErr(errText(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function onVerify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await api.mfa.verify(code.trim());
      router.push("/dashboard");
    } catch (e: any) {
      setErr(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-[520px] max-w-[95vw]">
        <div className="card" style={{ borderRadius: 16 }}>
          <h1 className="text-2xl font-bold mb-2 text-center">Multi‑factor enrollment</h1>
          <p className="text-sm text-[var(--muted)] mb-4 text-center">
            Scan the QR in your authenticator app, or enter the manual secret, then type a 6‑digit code.
          </p>

          {err && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2 mb-3">
              {err}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-center h-[200px] bg-gray-50 rounded">
              {qr ? <img src={qr} alt="MFA QR" className="h-[180px] w-[180px]" /> : "Loading QR..."}
            </div>

            {secret && (
              <div className="text-xs text-center text-gray-500">
                Can’t scan the QR? Add this secret manually: <code className="font-mono">{secret}</code>
              </div>
            )}

            <form onSubmit={onVerify} className="space-y-3">
              <input
                className="input w-full"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e)=>setCode(e.target.value)}
              />
              <button type="submit" disabled={busy} className="btn w-full">
                {busy ? "Verifying…" : "Verify"}
              </button>
              <a href="/" className="text-center text-sm text-gray-500 block">Back to login</a>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
