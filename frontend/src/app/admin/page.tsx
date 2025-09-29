/* frontend/src/app/admin/page.tsx — PART 2 of 2 (FULL FILE: replace the file with this complete version) */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  // Users
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminResetUserPassword,
  adminResetUserMfa,
  adminUpdateUser,
  // Referrals
  adminListReferrals,
  adminUpdateReferral,
  adminDeleteReferral,
  getReferralFiles,
  uploadReferralFiles,
  deleteReferralFile,
  // Announcements
  getAnnouncements,
  updateAnnouncements,
  // Audit
  fetchAuditPage,
  // Types
  type Referral,
  type User,
} from "@/lib/api";
import { formatAuditAction, type AuditRow } from "@/lib/auditLabel";

/* ------------------ cookie helpers ------------------ */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/`;
}

/* ------------------ error helpers ------------------ */
function isUnauthorized(err: any) {
  if (!err) return false;
  // Supports new wrapper behavior (err.status) and current text-only errors.
  return err.status === 401 || /\b401\b/.test(String(err?.message || ""));
}

type RefFile = { file_id: string; name: string; size: number; content_type?: string; created_at?: string };

export default function AdminPage() {
  /* ------------------ global banners ------------------ */
  const [authError, setAuthError] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  /* ------------------ users ------------------ */
  const [users, setUsers] = useState<User[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invFirst, setInvFirst] = useState("");
  const [invLast, setInvLast] = useState("");
  const [invRole, setInvRole] = useState<"AZOR" | "COVENANT">("AZOR");
  const [invPwd, setInvPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editRole, setEditRole] = useState<User["role"]>("AZOR");

  const [pwOpen, setPwOpen] = useState(false);
  const [pwTemp, setPwTemp] = useState("");

  /* ------------------ referrals (and files) ------------------ */
  const [refs, setRefs] = useState<Referral[]>([]);
  const [editRef, setEditRef] = useState<Referral | null>(null);
  const [ef, setEf] = useState<any>({});
  const [rfFiles, setRfFiles] = useState<RefFile[]>([]);
  const [rfNew, setRfNew] = useState<File[]>([]);

  /* Map for audit labels: referral id → ref_no */
  const refNoById = useMemo(() => new Map(refs.map((r) => [r.id, r.ref_no])), [refs]);

  /* ------------------ announcements ------------------ */
  const [annOpen, setAnnOpen] = useState(false);
  const [annItems, setAnnItems] = useState<string[]>([]);
  const [annBusy, setAnnBusy] = useState(false);
  const [annError, setAnnError] = useState<string | null>(null);

  /* ------------------ audit paging ------------------ */
  const initialLimit = (() => {
    const v = parseInt(getCookie("audit_page_size") || "50", 10);
    return Number.isFinite(v) && v > 0 ? v : 50;
  })();
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [limit, setLimit] = useState(initialLimit);
  const [offset, setOffset] = useState(0);
  const [loadingAudit, setLoadingAudit] = useState(false);

  /* ------------------ loaders ------------------ */
  async function loadUsers() {
    try {
      const data = await adminListUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (isUnauthorized(e)) setAuthError(true);
      else setPageError(e?.message || "Failed to load users.");
    }
  }
  async function loadReferrals() {
    try {
      const data = await adminListReferrals();
      setRefs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      if (isUnauthorized(e)) setAuthError(true);
      else setPageError(e?.message || "Failed to load referrals.");
    }
  }
  async function loadAnnouncements() {
    try {
      const a = await getAnnouncements();
      setAnnItems(a?.items || []);
    } catch (e: any) {
      // Soft-fail; announcements are non-critical.
      setAnnItems([]);
    }
  }
  async function loadAudit(off: number) {
    setLoadingAudit(true);
    try {
      const rows = await fetchAuditPage(limit, off);
      setAudit(Array.isArray(rows) ? rows : []);
      setOffset(off);
    } catch (e: any) {
      if (isUnauthorized(e)) setAuthError(true);
      else setPageError(e?.message || "Failed to load audit events.");
    } finally {
      setLoadingAudit(false);
    }
  }

  function refreshAudit() {
  // Re-pull the current page (keeps the user’s place)
  loadAudit(offset);
  }



  /* ------------------ init ------------------ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.all([loadUsers(), loadReferrals(), loadAnnouncements()]);
      if (!cancelled) await loadAudit(0);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]); // re-fetch first audit page when page size changes

  useEffect(() => {
    setCookie("audit_page_size", String(limit));
  }, [limit]);

  /* ------------------ user actions ------------------ */
  function openEditUser(u: User) {
    setEditUser(u);
    setEditFirst(u.first_name);
    setEditLast(u.last_name);
    setEditRole(u.role);
    setModalError(null);
    setEditOpen(true);
  }
  function openPw(u: User) {
    setEditUser(u);
    setPwTemp("");
    setModalError(null);
    setPwOpen(true);
  }
  async function confirmDeleteUser(id: string) {
    if (!confirm("Are you sure you want to remove this user?")) return;
    try {
      await adminDeleteUser(id);
      await loadUsers();
    } catch (e: any) {
      alert(e?.message || "Remove failed");
    }
  }
  async function saveUser() {
    if (!editUser) return;
    setBusy(true);
    setModalError(null);
    try {
      await adminUpdateUser(editUser.id, {
        first_name: editFirst.trim(),
        last_name: editLast.trim(),
        role: editRole,
      });
      await loadUsers(); // refetch after PATCH (consistency over speed)
      setEditOpen(false);
    } catch (e: any) {
      setModalError(e?.message || "Update failed");
    } finally {
      setBusy(false);
    }
  }
  async function confirmResetPassword() {
    if (!editUser) return;
    if ((pwTemp || "").length < 15) {
      alert("Password must be at least 15 characters.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await adminResetUserPassword(editUser.id, pwTemp);
      setPwOpen(false);
    } catch (e: any) {
      setModalError(e?.message || "Password reset failed");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------ invite user ------------------ */
  async function inviteUser() {
    if ((invPwd || "").length < 15) {
      setModalError("Temporary password must be at least 15 characters.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await adminCreateUser({
        email: invEmail.trim(),
        first_name: invFirst.trim(),
        last_name: invLast.trim(),
        role: invRole,
        password: invPwd,
      });
      await loadUsers(); // ensure consistent state after create
      setInviteOpen(false);
      setInvEmail(""); setInvFirst(""); setInvLast(""); setInvPwd(""); setInvRole("AZOR");
    } catch (e: any) {
      setModalError(e?.message || "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  /* ------------------ referrals actions ------------------ */
  function openEditRef(r: Referral) {
    setEditRef(r);
    setEf({
      company: r.company || "",
      status: r.status || "New",
      contact_name: r.contact_name || "",
      contact_email: r.contact_email || "",
      contact_phone: r.contact_phone || "",
      notes: r.notes || "",
      locationsCsv: "",
      env_users: "",
      env_phone_provider: "",
      env_isp: "",
      env_bandwidth: "",
      env_it_model: "",
    });
    (async () => {
      try {
        const files = (await getReferralFiles(r.id)) as any;
        setRfFiles(Array.isArray(files) ? files : (files?.files || []));
      } catch {
        setRfFiles([]);
      }
    })();
  }
  async function saveRef() {
    if (!editRef) return;
    setBusy(true);
    setModalError(null);
    try {
      const body: any = {
        company: ef.company,
        status: ef.status,
        contact_name: ef.contact_name,
        contact_email: ef.contact_email,
        contact_phone: ef.contact_phone,
        notes: ef.notes || null,
      };
      if (ef.locationsCsv?.trim()) {
        body.locations = ef.locationsCsv
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }
      body.environment = {
        users: ef.env_users ? Number(ef.env_users) : undefined,
        phone_provider: ef.env_phone_provider || undefined,
        internet_provider: ef.env_isp || undefined,
        internet_bandwidth_mbps: ef.env_bandwidth ? Number(ef.env_bandwidth) : undefined,
        it_model: ef.env_it_model || undefined,
      };
      const updated = await adminUpdateReferral(editRef.id, body);
      setRefs((prev) => prev.map((x) => (x.id === editRef.id ? { ...x, ...updated } : x)));

      if (rfNew.length > 0) {
        await uploadReferralFiles(editRef.id, rfNew);
        const files = (await getReferralFiles(editRef.id)) as any;
        setRfFiles(Array.isArray(files) ? files : (files?.files || []));
        setRfNew([]);
      }
      setEditRef(null);
    } catch (e: any) {
      setModalError(e?.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }
  async function confirmDeleteReferral(id: string) {
    if (!confirm("Are you sure you want to delete this referral?")) return;
    try {
      await adminDeleteReferral(id);
      setRefs((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  /* ------------------ announcements ------------------ */
  async function saveAnnouncements() {
    setAnnBusy(true);
    setAnnError(null);
    try {
      await updateAnnouncements({ items: annItems.filter((t) => t.trim().length > 0) });
      setAnnOpen(false);
    } catch (e: any) {
      setAnnError(e?.message || "Save failed");
    } finally {
      setAnnBusy(false);
    }
  }

  /* ------------------ render ------------------ */
  return (
    <div className="p-6 space-y-6">
      {/* top bar */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Admin</h1>
        <div className="flex gap-2">
          <button className="btn ghost" onClick={() => setAnnOpen(true)}>
            Edit announcements
          </button>
          <button className="btn" onClick={() => setInviteOpen(true)}>
            Invite User
          </button>
        </div>
      </div>

      {/* auth + error banners */}
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

      {/* Users */}
      <div className="card">
        <div className="font-semibold mb-2">Users</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left border-b">Email</th>
                <th className="px-3 py-2 text-left border-b">Name</th>
                <th className="px-3 py-2 text-left border-b">Role</th>
                <th className="px-3 py-2 text-right border-b w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-3 text-center text-gray-500">
                    No users
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="btn ghost" onClick={() => openEditUser(u)}>
                          Edit
                        </button>
                        <button className="btn ghost" onClick={() => openPw(u)}>
                          Reset Password
                        </button>
                        <button className="btn ghost" onClick={() => adminResetUserMfa(u.id)}>
                          Reset MFA
                        </button>
                        <button className="btn ghost" onClick={() => confirmDeleteUser(u.id)}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referrals */}
      <div className="card">
        <div className="font-semibold mb-2">Referrals</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left border-b">Ref No</th>
                <th className="px-3 py-2 text-left border-b">Company</th>
                <th className="px-3 py-2 text-left border-b">Status</th>
                <th className="px-3 py-2 text-left border-b">Created</th>
                <th className="px-3 py-2 text-right border-b w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-gray-500">
                    No referrals
                  </td>
                </tr>
              ) : (
                refs.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.ref_no}</td>
                    <td className="px-3 py-2">{r.company}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="btn ghost" onClick={() => openEditRef(r)}>
                          Edit
                        </button>
                        <a className="btn ghost" href={`/referral`}>
                          View
                        </a>
                        <button className="btn ghost" onClick={() => confirmDeleteReferral(r.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">Audit</div>
          <button className="btn ghost" onClick={refreshAudit} disabled={loadingAudit}>
            {loadingAudit ? "Refreshing…" : "Refresh"}
          </button>
        </div>


        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left border-b">When</th>
                <th className="px-3 py-2 text-left border-b">ID</th>
                <th className="px-3 py-2 text-left border-b">Actor</th>
                <th className="px-3 py-2 text-left border-b">Action</th>
                <th className="px-3 py-2 text-left border-b">Entity</th>
              </tr>
            </thead>
            <tbody>
              {audit.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-gray-500">
                    {loadingAudit ? "Loading…" : "No events"}
                  </td>
                </tr>
              ) : (
                audit.map((a, i) => (
                  <tr key={`${a.created_at}:${a.entity_type}:${a.entity_id}:${i}`} className="border-b">
                    <td className="px-3 py-2">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-3 py-2">{a.actor_email || "-"}</td>
                    <td className="px-3 py-2">{`${a.actor_first_name || ""} ${a.actor_last_name || ""}`.trim() || "-"}</td>
                    <td className="px-3 py-2">{formatAuditAction(a, refNoById)}</td>
                    <td className="px-3 py-2">{a.entity_type || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm">Page size</label>
          <select
            className="input"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 10)}
            aria-label="Audit page size"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button
              className="btn ghost"
              onClick={() => loadAudit(Math.max(0, offset - limit))}
              disabled={offset === 0 || loadingAudit}
            >
              Prev
            </button>
            <button
              className="btn ghost"
              onClick={() => loadAudit(offset + limit)}
              disabled={loadingAudit || audit.length < limit}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* --------- Announcements modal --------- */}
      {annOpen && (
        <div className="modal-backdrop" onClick={() => setAnnOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Edit announcements</div>
              <button className="btn ghost" onClick={() => setAnnOpen(false)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {annError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{annError}</div>
              )}
              <div className="text-sm text-[var(--muted)]">One announcement per line. These show on the dashboard.</div>
              <textarea
                className="input w-full min-h-[160px]"
                value={annItems.join("\n")}
                onChange={(e) => setAnnItems(e.target.value.split("\n"))}
              />
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setAnnOpen(false)}>
                Cancel
              </button>
              <button className="btn" disabled={annBusy} onClick={saveAnnouncements}>
                {annBusy ? "Saving…" : "Save"}
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --------- Invite user modal --------- */}
      {inviteOpen && (
        <div className="modal-backdrop" onClick={() => setInviteOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Invite User</div>
              <button className="btn ghost" onClick={() => setInviteOpen(false)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {modalError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{modalError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="input w-full" type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select className="input w-full" value={invRole} onChange={(e) => setInvRole(e.target.value as any)}>
                    <option value="AZOR">AZOR (Agent)</option>
                    <option value="COVENANT">COVENANT (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text sm font-medium mb-1">First name</label>
                  <input className="input w-full" value={invFirst} onChange={(e) => setInvFirst(e.target.value)} />
                </div>
                <div>
                  <label className="block text sm font-medium mb-1">Last name</label>
                  <input className="input w-full" value={invLast} onChange={(e) => setInvLast(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Temp password (≥15)</label>
                  <input className="input w-full" value={invPwd} onChange={(e) => setInvPwd(e.target.value)} />
                </div>
              </div>
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setInviteOpen(false)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={inviteUser}>
                Send invite
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --------- Edit user modal --------- */}
      {editOpen && editUser && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Edit user</div>
              <button className="btn ghost" onClick={() => setEditOpen(false)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {modalError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{modalError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input className="input w-full" value={editUser.email} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First name</label>
                  <input className="input w-full" value={editFirst} onChange={(e) => setEditFirst(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last name</label>
                  <input className="input w-full" value={editLast} onChange={(e) => setEditLast(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select className="input w-full" value={editRole} onChange={(e) => setEditRole(e.target.value as any)}>
                    <option value="AZOR">AZOR (Agent)</option>
                    <option value="COVENANT">COVENANT (Admin)</option>
                  </select>
                </div>
              </div>
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={saveUser}>
                Save changes
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --------- Reset password modal --------- */}
      {pwOpen && editUser && (
        <div className="modal-backdrop" onClick={() => setPwOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Reset password for {editUser.email}</div>
              <button className="btn ghost" onClick={() => setPwOpen(false)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {modalError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{modalError}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Temporary password (≥15 chars)</label>
                <input
                  className="input w-full"
                  value={pwTemp}
                  onChange={(e) => setPwTemp(e.target.value)}
                  minLength={15}
                />
              </div>
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setPwOpen(false)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={confirmResetPassword}>
                Reset
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* --------- Edit referral modal --------- */}
      {editRef && (
        <div className="modal-backdrop" onClick={() => setEditRef(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Edit {editRef.ref_no}</div>
              <button className="btn ghost" onClick={() => setEditRef(null)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {modalError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{modalError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    className="input w-full"
                    value={ef.company}
                    onChange={(e) => setEf((p: any) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input w-full"
                    value={ef.status}
                    onChange={(e) => setEf((p: any) => ({ ...p, status: e.target.value }))}
                  >
                    {["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "On Hold", "Commission Paid"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    className="input w-full"
                    value={ef.contact_name}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={ef.contact_email}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text sm font-medium mb-1">Contact Phone</label>
                  <input
                    className="input w-full"
                    value={ef.contact_phone}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_phone: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Locations (CSV)</label>
                  <input
                    className="input w-full"
                    value={ef.locationsCsv}
                    onChange={(e) => setEf((p: any) => ({ ...p, locationsCsv: e.target.value }))}
                    placeholder="NYC, Boston, ..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="input w-full min-h-[120px]"
                    value={ef.notes}
                    onChange={(e) => setEf((p: any) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="font-semibold">Files</div>
              {rfFiles.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">No files</div>
              ) : (
                <ul className="text-sm list-disc ml-5">
                  {rfFiles.map((f: any) => (
                    <li key={f.file_id} className="flex items-center justify-between gap-3">
                      <span>
                        {f.name} ({f.size} bytes)
                      </span>
                      <button
                        className="btn ghost"
                        onClick={() => {
                          if (!editRef) return;
                          if (confirm("Remove this file?")) {
                            deleteReferralFile(editRef.id, f.file_id)
                              .then(() => setRfFiles((prev) => prev.filter((x) => x.file_id !== f.file_id)))
                              .catch((e) => alert(e?.message || "Remove failed"));
                          }
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <input
                  className="block w-full text-sm"
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={(e) => setRfNew(e.target.files ? Array.from(e.target.files) : [])}
                />
                <div className="text-xs text-gray-600 mt-1">Add files. Any type.</div>
              </div>
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setEditRef(null)}>
                Cancel
              </button>
              <button className="btn" disabled={busy} onClick={saveRef}>
                Save changes
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
