/* frontend/src/app/admin/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  adminListUsers,
  adminListReferrals,
  adminCreateUser,
  adminDeleteUser,
  adminResetUserPassword,
  adminResetUserMfa,
  adminDeleteReferral,
  fetchAuditPage,
  type Referral,
  type User,
} from "@/lib/api";
import { formatAuditAction, type AuditRow } from "@/lib/auditLabel";

export default function AdminPage() {
  // Users
  const [users, setUsers] = useState<User[]>([]);
  // Referrals
  const [refs, setRefs] = useState<Referral[]>([]);
  const refNoById = useMemo(() => new Map(refs.map(r => [r.id, r.ref_no])), [refs]);

  // Audit
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Invite modal
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invFirst, setInvFirst] = useState("");
  const [invLast, setInvLast] = useState("");
  const [invRole, setInvRole] = useState<"AZOR"|"COVENANT">("AZOR");
  const [invPwd, setInvPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|null>(null);

  async function doInvite() {
    setBusy(true); setError(null);
    try {
      const created = await adminCreateUser({
        email: invEmail.trim(),
        first_name: invFirst.trim(),
        last_name: invLast.trim(),
        role: invRole,
        password: invPwd,
      });
      setUsers(prev => [created, ...prev]);
      setInviteOpen(false);
      setInvEmail(""); setInvFirst(""); setInvLast(""); setInvRole("AZOR"); setInvPwd("");
    } catch (e:any) {
      setError(e?.message || "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function loadAudit(off: number) {
    setLoadingAudit(true);
    try {
      const rows = await fetchAuditPage(limit, off);
      setAudit(Array.isArray(rows) ? rows : []);
      setOffset(off);
    } finally {
      setLoadingAudit(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const [u, r] = await Promise.all([adminListUsers(), adminListReferrals()]);
        setUsers(u || []);
        setRefs(r || []);
      } catch {
        // handled by 401 redirect in apiFetch
      }
      loadAudit(0);
    })();
  }, [limit]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <button className="btn" onClick={()=>setInviteOpen(true)}>Invite User</button>
      </div>

      {/* Users */}
      <div className="card">
        <div className="font-semibold mb-2">Users</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left border-b">Email</th>
              <th className="px-3 py-2 text-left border-b">Name</th>
              <th className="px-3 py-2 text-left border-b">Role</th>
              <th className="px-3 py-2 text-left border-b">Actions</th>
            </tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-3 py-3 text-center text-gray-500">No users</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="border-b">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.first_name} {u.last_name}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <button className="btn ghost" onClick={()=>adminResetUserPassword(u.id, "PleaseSetANewPassword15")}>Reset Password</button>
                      <button className="btn ghost" onClick={()=>adminResetUserMfa(u.id)}>Reset MFA</button>
                      <button className="btn ghost" onClick={()=>adminDeleteUser(u.id)}>Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrals */}
      <div className="card">
        <div className="font-semibold mb-2">Referrals</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left border-b">Ref No</th>
              <th className="px-3 py-2 text-left border-b">Company</th>
              <th className="px-3 py-2 text-left border-b">Status</th>
              <th className="px-3 py-2 text-left border-b">Created</th>
              <th className="px-3 py-2 text-left border-b">Actions</th>
            </tr></thead>
            <tbody>
              {refs.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-3 text-center text-gray-500">No referrals</td></tr>
              ) : refs.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-3 py-2">{r.ref_no}</td>
                  <td className="px-3 py-2">{r.company}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2 justify-end">
                      <a className="btn ghost" href={`/referral`}>View</a>
                      <button className="btn ghost" onClick={()=>adminDeleteReferral(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit */}
      <div className="card">
        <div className="font-semibold mb-2">Audit</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50"><tr>
              <th className="px-3 py-2 text-left border-b">When</th>
              <th className="px-3 py-2 text-left border-b">ID</th>
              <th className="px-3 py-2 text-left border-b">Actor</th>
              <th className="px-3 py-2 text-left border-b">Action</th>
              <th className="px-3 py-2 text-left border-b">Entity</th>
            </tr></thead>
            <tbody>
              {audit.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-3 text-center text-gray-500">{loadingAudit ? "Loading…" : "No events"}</td></tr>
              ) : audit.map((a, i) => (
                <tr key={i} className="border-b">
                  <td className="px-3 py-2">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{a.actor_email || "-"}</td>
                  <td className="px-3 py-2">{`${a.actor_first_name || ""} ${a.actor_last_name || ""}`.trim() || "-"}</td>
                  <td className="px-3 py-2">{formatAuditAction(a, refNoById)}</td>
                  <td className="px-3 py-2">{a.entity_type || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm">Page size</label>
          <select className="input" value={limit} onChange={e => setLimit(parseInt(e.target.value) || 50)}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button className="btn ghost" onClick={() => loadAudit(Math.max(0, offset - limit))}>Prev</button>
            <button className="btn ghost" onClick={() => loadAudit(offset + limit)}>Next</button>
          </div>
        </div>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="modal-backdrop" onClick={()=>setInviteOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <header>
              <div>Invite User</div>
              <button className="btn ghost" onClick={()=>setInviteOpen(false)}>Close</button>
            </header>
            <section className="space-y-3">
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Email</label><input className="input w-full" type="email" value={invEmail} onChange={e=>setInvEmail(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Role</label>
                  <select className="input w-full" value={invRole} onChange={e=>setInvRole(e.target.value as any)}>
                    <option value="AZOR">AZOR</option>
                    <option value="COVENANT">COVENANT</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">First name</label><input className="input w-full" value={invFirst} onChange={e=>setInvFirst(e.target.value)} /></div>
                <div><label className="block text-sm font-medium mb-1">Last name</label><input className="input w-full" value={invLast} onChange={e=>setInvLast(e.target.value)} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Temp password (≥15)</label><input className="input w-full" value={invPwd} onChange={e=>setInvPwd(e.target.value)} /></div>
              </div>
            </section>
            <footer>
              <button className="btn ghost" onClick={()=>setInviteOpen(false)}>Cancel</button>
              <button className="btn" disabled={busy} onClick={doInvite}>{busy?"Inviting…":"Send invite"}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
