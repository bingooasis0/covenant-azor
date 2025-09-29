/* frontend/src/app/account/page.tsx */
"use client";

import React, { useEffect, useState } from "react";
import { fetchMe, changePassword, mfaReset, type User } from "@/lib/api";

export default function Account() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setAuthError(false);
      setPageError(null);
      try {
        const u = await fetchMe();
        if (!cancelled) setMe(u);
      } catch (e: any) {
        if (!cancelled) {
          if (e?.status === 401) setAuthError(true);
          else setPageError(e?.message || "Failed to load profile.");
          setMe(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onChangePassword() {
    if (!oldPwd || !newPwd) {
      setToast("Enter both old and new password.");
      return;
    }
    setBusy(true);
    setToast(null);
    try {
      await changePassword(oldPwd, newPwd);
      setToast("Password changed.");
      setOldPwd("");
      setNewPwd("");
    } catch (e: any) {
      setToast(e?.message || "Change password failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onResetMfa() {
    setBusy(true);
    setToast(null);
    try {
      await mfaReset();
      setToast("MFA reset requested.");
    } catch (e: any) {
      setToast(e?.message || "MFA reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Account</h1>

      {authError && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
          Session expired or unauthorized. Please{" "}
          <a className="link" href="/" aria-label="Sign in">
            sign in again
          </a>
          .
        </div>
      )}
      {pageError && !authError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{pageError}</div>
      )}
      {toast && (
        <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2">{toast}</div>
      )}

      <div className="card">
        <div className="font-semibold mb-2">Profile</div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div
            className="grid"
            style={{ display: "grid", gridTemplateColumns: "220px 1fr", rowGap: 10 }}
          >
            <div className="label">User ID</div>
            <div>{me?.id || "-"}</div>

            <div className="label">Role</div>
            <div>{me?.role || "-"}</div>

            <div className="label">Email</div>
            <div>{me?.email || "-"}</div>

            <div className="label">Name</div>
            <div>
              {me ? `${me.first_name || ""} ${me.last_name || ""}`.trim() || "-" : "-"}
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="font-semibold mb-2">Security</div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Old password</label>
            <input
              className="input w-full"
              type="password"
              autoComplete="current-password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New password</label>
            <input
              className="input w-full"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button className="btn" disabled={busy} onClick={onChangePassword}>
              {busy ? "Working…" : "Change password"}
            </button>
            <button className="btn ghost" disabled={busy} onClick={onResetMfa}>
              Reset Multi-Factor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
