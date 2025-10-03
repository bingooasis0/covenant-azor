/* frontend/src/app/account/page.tsx */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
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
          // our wrappers now attach err.status when possible
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
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {pageError}
        </div>
      )}
      {toast && (
        <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-md p-2">
          {toast}
        </div>
      )}

      {/* Profile */}
      <div className="card">
        <div className="font-semibold mb-3">Profile</div>
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-medium text-gray-700 w-40">User ID</td>
                    <td className="px-3 py-2">{me?.id || "-"}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-medium text-gray-700">Email</td>
                    <td className="px-3 py-2">{me?.email || "-"}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">Name</td>
                    <td className="px-3 py-2">{me ? `${me.first_name || ""} ${me.last_name || ""}`.trim() || "-" : "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-medium text-gray-700 w-40">Role</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${me?.role === 'COVENANT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {me?.role || "-"}
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-3 py-2 font-medium text-gray-700">Account Created</td>
                    <td className="px-3 py-2">{me?.created_at ? new Date(me.created_at).toLocaleString() : "-"}</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-gray-700">MFA Enabled</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 text-xs rounded ${me?.mfa_enabled ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {me?.mfa_enabled ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Security */}
      <div className="card">
        <div className="font-semibold mb-3">Security</div>

        {/* Change Password */}
        <div className="mb-4 max-w-3xl">
          <div className="text-sm font-medium text-gray-700 mb-2">Change Password</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Old Password</label>
              <input
                className="input w-full text-sm"
                type="password"
                autoComplete="current-password"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">New Password</label>
              <input
                className="input w-full text-sm"
                type="password"
                autoComplete="new-password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="New password (min 15 chars)"
              />
            </div>
          </div>
          <button className="btn text-sm" disabled={busy} onClick={onChangePassword}>
            {busy ? "Updating…" : "Update Password"}
          </button>
        </div>

        <hr className="border-gray-200 my-4" />

        {/* Multi-Factor Authentication */}
        <div>
          <div className="text-sm font-medium text-gray-700 mb-2">Multi-Factor Authentication</div>
          <div className="text-xs text-gray-600 mb-3">
            Secure your account with time-based one-time passwords (TOTP) using an authenticator app.
          </div>
          <div className="flex gap-2">
            <Link href="/account/mfa" className="btn text-sm">
              Manage MFA
            </Link>
            <button className="btn ghost text-sm" disabled={busy} onClick={onResetMfa}>
              Reset MFA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
