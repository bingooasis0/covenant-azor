"use client";
import { useState, useRef } from "react";
import axios from "axios";

export default function MfaSetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const blocker = useRef(false); // prevents double-click spam

  async function handleSetup() {
    if (blocker.current || loading) return;
    setErr(null);
    setLoading(true);
    blocker.current = true;
    try {
      const r = await axios.post("/users/mfa/setup", { username: email, password });
      setSecret(r.data?.secret || null);
      setOtpauthUrl(r.data?.otpauth_url || null);
    } catch (e: any) {
      const msg = e?.response?.status === 429 ? "Too many attempts, slow down." : (e?.response?.data?.detail || e?.message || "Failed");
      setErr(msg);
    } finally {
      setLoading(false);
      setTimeout(() => { blocker.current = false; }, 1500); // small cool-down
    }
  }

  return (
    <div className="wrap space-y-4">
      <h1 className="text-xl font-semibold">Set up MFA</h1>

      {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}

      <div className="card space-y-3">
        <div>
          <label className="label">Email</label>
          <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn" onClick={handleSetup} disabled={loading}>
          {loading ? "Requesting…" : "Generate Secret"}
        </button>
      </div>

      {secret && (
        <div className="card">
          <div className="label">Secret</div>
          <div className="mono">{secret}</div>
          {otpauthUrl && (
            <div className="mt-2 text-sm">
              Add to your authenticator using this <a className="link" href={otpauthUrl}>otpauth:// link</a>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
