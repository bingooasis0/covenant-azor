// frontend/src/components/auth/MfaEnrollModal.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { login, mfaSetup, mfaVerify, errText } from '@/lib/api';
import { useRouter } from 'next/navigation';

type Props = {
  open: boolean;
  email: string;
  password: string;
  onClose: () => void;
};

function parseSecret(otpauth_url?: string, fallback?: string) {
  if (fallback) return fallback;
  try {
    if (!otpauth_url) return '';
    const u = new URL(otpauth_url);
    return u.searchParams.get('secret') || '';
  } catch {
    return '';
  }
}

export default function MfaEnrollModal({ open, email, password, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [qr, setQr] = useState<string>('');
  const [otpauth, setOtpauth] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [recovery, setRecovery] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>('');

  // Fetch enrollment payload when opened
  useEffect(() => {
    let alive = true;
    if (!open) return;
    setLoading(true);
    setError('');
    setQr(''); setOtpauth(''); setSecret(''); setRecovery([]); setCode('');

    (async () => {
      try {
        const data = await mfaSetup();
        if (!alive) return;
        setOtpauth(data?.otpauth || '');
        setQr(data?.qr || '');
        setRecovery(Array.isArray(data?.recovery_codes) ? data.recovery_codes : []);
        setSecret(parseSecret(data?.otpauth, data?.secret));
      } catch (e) {
        if (!alive) return;
        setError(errText(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [open]);

  const qrSrc = useMemo(() => {
    if (!qr) return '';
    // backend may return a data URL or bare base64
    return qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`;
  }, [qr]);

  async function handleVerify() {
    setError('');
    const pin = code.trim();
    if (!/^\d{6}$/.test(pin)) {
      setError('Enter the 6‑digit code.');
      return;
    }
    try {
      setLoading(true);
      const ok = await mfaVerify(pin);
      if (!ok?.ok) throw new Error('Verification failed');
      // MFA is verified; log in again
      const res = await login(email, password);
      if (!res?.access_token) throw new Error('Login failed after MFA setup');
      router.push('/dashboard');
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
      <div className="card" style={{ width: 'min(720px, 94vw)', maxHeight: '90vh', overflow: 'auto', padding: 16 }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Set up Multi‑Factor Authentication</h2>
          <button className="btn ghost" onClick={onClose} disabled={loading}>Close</button>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <ol className="list-decimal ml-5 space-y-4 text-sm">
          <li>
            Install/open an authenticator app (1Password, Microsoft Authenticator, Google Authenticator, etc.).
          </li>

          <li>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
              <div className="flex items-center justify-center border rounded p-2" style={{ minHeight: 220 }}>
                {qrSrc ? <img alt="MFA QR" src={qrSrc} style={{ width: 200, height: 200 }} /> : <div>Loading QR…</div>}
              </div>
              <div>
                <div className="label">Can’t scan?</div>
                <div className="panel-2 rounded p-2">
                  <div className="mb-1 font-medium">Enter this key manually (Base32 secret)</div>
                  <div className="flex items-center gap-2">
                    <code style={{ wordBreak: 'break-all' }}>{secret || '—'}</code>
                    {secret && (
                      <button
                        className="btn ghost"
                        onClick={() => navigator.clipboard.writeText(secret)}
                        disabled={!secret}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                  {otpauth && (
                    <details className="mt-2">
                      <summary className="cursor-pointer">Show full otpauth URL</summary>
                      <div className="mt-1 break-all text-[12px]">{otpauth}</div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </li>

          <li>
            <div className="label mb-1">Recovery codes (store safely)</div>
            {recovery.length ? (
              <div className="panel-2 rounded p-2">
                <ul className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 6 }}>
                  {recovery.map((r, i) => (
                    <li key={i}><code>{r}</code></li>
                  ))}
                </ul>
                <div className="mt-2">
                  <button
                    className="btn ghost"
                    onClick={() => navigator.clipboard.writeText(recovery.join('\n'))}
                  >
                    Copy all
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-[var(--muted)]">Loading…</div>
            )}
          </li>

          <li>
            <div className="label mb-1">Enter the 6‑digit code from your app</div>
            <div className="flex items-center gap-2">
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                className="input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
              />
              <button className="btn" disabled={loading || code.length !== 6} onClick={handleVerify}>
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
