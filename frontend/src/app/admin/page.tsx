// frontend/src/app/admin/page.tsx
"use client";

import { useRequireRole } from "@/hooks/useRequireRole";
import { useEffect, useMemo, useState } from "react";
import {
  adminListUsers, adminCreateUser, adminDeleteUser, adminResetUserPassword, adminResetUserMfa,
  adminListReferrals, adminUpdateReferral, adminDeleteReferral, fetchAuditPage,
  UserT, RefT
} from "@/lib/api/index";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { IconEdit, IconTrash, IconUserPlus, IconEye, IconKey, IconShield } from "@/lib/icons";

export default function AdminPage() {
  const ok = useRequireRole("COVENANT");

  const [users, setUsers] = useState<UserT[]>([]);
  const [referrals, setReferrals] = useState<RefT[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [editUser, setEditUser] = useState<UserT | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserT | null>(null);
  const [viewRef, setViewRef] = useState<RefT | null>(null);

  useEffect(() => {
    if (!ok) return;
    (async () => {
      try { setUsers(await adminListUsers()); } catch {}
      try { setReferrals(await adminListReferrals()); } catch {}
    })();
  }, [ok]);

  if (!ok) return <div className="p-6 text-sm">Loading...</div>;

  const emailOf = (u:UserT) => u.email || (u as any).Email || "";
  const nameOf  = (u:UserT) => {
    const first = u.first_name || (u as any).firstName || "";
    const last  = u.last_name  || (u as any).lastName  || "";
    const combo = `${first} ${last}`.trim();
    return combo || (u as any).name || "";
  };

  return (
    <div className="p-6 space-y-8" style={{ maxWidth: "none" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
        <Button onClick={() => setShowInvite(true)}><IconUserPlus className="icon" />Invite User</Button>
      </div>

      {/* Users */}
      <section>
        <div className="card">
          <h2 className="text-lg font-medium mb-2">Users</h2>
          <div className="overflow-auto border rounded panel-2">
            <table className="table">
              <thead>
                <tr><th>Email</th><th>Name</th><th>Role</th><th style={{width:160}}>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id || emailOf(u) || `user-${i}`}>
                    <td>{emailOf(u)}</td>
                    <td>{nameOf(u)}</td>
                    <td>{(u.role as string) || ""}</td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn ghost" onClick={() => setEditUser(u)}><IconEdit className="icon" />Edit</button>
                        <button className="btn danger" onClick={() => setConfirmUser(u)}><IconTrash className="icon" />Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 12 }}>No users</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Referrals */}
      <section>
        <div className="card">
          <h2 className="text-lg font-medium mb-2">Referrals</h2>
          <div className="overflow-auto border rounded panel-2">
            <table className="table">
              <thead>
                <tr><th>Ref No</th><th>Company</th><th>Status</th><th>Created</th><th style={{width:120}}>View</th></tr>
              </thead>
              <tbody>
                {referrals.map((r, i) => (
                  <tr key={r.id || r.ref_no || `ref-${i}`}>
                    <td>{r.ref_no || r.id}</td>
                    <td>{r.company || ""}</td>
                    <td>{r.status ? <Badge status={r.status} /> : ""}</td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                    <td><button className="btn ghost" onClick={() => setViewRef(r)}><IconEye className="icon" />View</button></td>
                  </tr>
                ))}
                {referrals.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", padding: 12 }}>No referrals</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Audit */}
      <section>
        <div className="card">
          <h2 className="text-lg font-medium mb-2">Audit</h2>
          <AuditTable users={users} />
        </div>
      </section>

      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} onCreated={async () => {
        setShowInvite(false); setUsers(await adminListUsers());
      }} />

      <EditUserModal user={editUser} onClose={() => setEditUser(null)} onUpdated={async () => {
        setEditUser(null); setUsers(await adminListUsers());
      }} />

      <Modal open={!!confirmUser} title="Confirm delete" onClose={() => setConfirmUser(null)} footer={
        <>
          <Button tone="ghost" onClick={() => setConfirmUser(null)}>Cancel</Button>
          <Button tone="danger" onClick={async () => {
            if (confirmUser) { await adminDeleteUser(confirmUser.id); setUsers(await adminListUsers()); setConfirmUser(null); }
          }}>Delete</Button>
        </>
      }>
        <p>Delete {emailOf((confirmUser as any) || {})}?</p>
      </Modal>

      <ReferralModal referral={viewRef} onClose={() => setViewRef(null)} onChanged={async () => {
        setReferrals(await adminListReferrals());
      }} />
    </div>
  );
}

function InviteUserModal({ open, onClose, onCreated }:{ open: boolean; onClose: () => void; onCreated: () => Promise<void>; }) {
  const [form, setForm] = useState({ email:"", first_name:"", last_name:"", role:"AZOR", password:"" });
  return (
    <Modal open={open} title="Invite User" onClose={onClose} footer={
      <>
        <Button tone="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={async () => { await adminCreateUser(form); await onCreated(); }}>Create</Button>
      </>
    }>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
        <div><label className="label">Role</label>
          <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="AZOR">AZOR</option><option value="COVENANT">COVENANT</option>
          </select>
        </div>
        <div><label className="label">First name</label><input className="input" value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} /></div>
        <div><label className="label">Last name</label><input className="input" value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} /></div>
        <div className="col-span-2"><label className="label">Temp password</label><input className="input" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onUpdated }:{ user: UserT | null; onClose: () => void; onUpdated: () => Promise<void>; }) {
  const [form, setForm] = useState<UserT | null>(user);
  const [newPass, setNewPass] = useState("");
  useEffect(() => { setForm(user); }, [user]);
  if (!user) return null;
  return (
    <Modal open={!!user} title="Edit User" onClose={onClose} footer={
      <>
        <Button tone="ghost" onClick={onClose}>Close</Button>
        <Button onClick={async () => { if (!form) return; await adminResetUserPassword((form as any).id, newPass); setNewPass(""); }}>
          <IconKey className="icon" /> Set password
        </Button>
        <Button onClick={async () => { await adminResetUserMfa((user as any).id); }}>
          <IconShield className="icon" /> Reset Multi-Factor
        </Button>
        <Button onClick={async () => { if (!form) return; await onUpdated(); }}>Save</Button>
      </>
    }>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="label">Email</label><input className="input" value={(form as any)?.email || ""} onChange={e=>setForm({ ...(form as any), email: e.target.value })} /></div>
        <div><label className="label">Role</label>
          <select className="input" value={(form as any)?.role || "AZOR"} onChange={e=>setForm({ ...(form as any), role: e.target.value as any })}>
            <option value="AZOR">AZOR</option><option value="COVENANT">COVENANT</option>
          </select>
        </div>
        <div><label className="label">First name</label><input className="input" value={(form as any)?.first_name || ""} onChange={e=>setForm({ ...(form as any), first_name: e.target.value })} /></div>
        <div><label className="label">Last name</label><input className="input" value={(form as any)?.last_name || ""} onChange={e=>setForm({ ...(form as any), last_name: e.target.value })} /></div>
        <div className="col-span-2">
          <label className="label">Set new password</label>
          <input className="input w-full" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ReferralModal({ referral, onClose, onChanged }:{ referral: RefT | null; onClose: () => void; onChanged: () => Promise<void>; }) {
  const [form, setForm] = useState<RefT | null>(referral);
  useEffect(() => { setForm(referral); }, [referral]);
  if (!referral) return null;
  return (
    <Modal open={!!referral} title={`Referral ${referral.ref_no || referral.id}`} onClose={onClose} footer={
      <>
        <Button tone="ghost" onClick={onClose}>Close</Button>
        <Button tone="danger" onClick={async () => {
          if (!referral?.id) return;
          await adminDeleteReferral(referral.id);
          await onChanged();
          onClose();
        }}>
          <IconTrash className="icon" /> Delete
        </Button>
        <Button onClick={async () => {
          if (!form || !referral?.id) return;
          await adminUpdateReferral(referral.id, form);
          await onChanged();
          onClose();
        }}>Save</Button>
      </>
    }>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label className="label">Status</label>
          <select className="input" value={(form as any)?.status || "New"} onChange={e=>setForm({ ...(form as any), status: e.target.value })}>
            <option>New</option><option>Contacted</option><option>Qualified</option><option>Proposal Sent</option><option>Won</option><option>Lost</option><option>Commission Paid</option>
          </select>
        </div>
        <div><label className="label">Company</label><input className="input" value={(form as any)?.company || ""} onChange={e=>setForm({ ...(form as any), company: e.target.value })} /></div>
        <div><label className="label">Contact name</label><input className="input" value={(form as any)?.contact_name || ""} onChange={e=>setForm({ ...(form as any), contact_name: e.target.value })} /></div>
        <div><label className="label">Contact email</label><input className="input" type="email" value={(form as any)?.contact_email || ""} onChange={e=>setForm({ ...(form as any), contact_email: e.target.value })} /></div>
        <div><label className="label">Contact phone</label><input className="input" value={(form as any)?.contact_phone || ""} onChange={e=>setForm({ ...(form as any), contact_phone: e.target.value })} /></div>
        <div className="col-span-2"><label className="label">Notes</label><textarea className="input w-full min-h-[120px]" value={(form as any)?.notes || ""} onChange={e=>setForm({ ...(form as any), notes: e.target.value })} /></div>
      </div>
    </Modal>
  );
}

/* ---------- Audit (client-side name join) ---------- */
function AuditTable({ users }:{ users: UserT[] }) {
  const [rows, setRows] = useState<any[]>([]);
  const [limit, setLimit] = useState<number>(50);
  const [offset, setOffset] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const nameById = useMemo(() => {
    const m: Record<string,string> = {};
    for (const u of users) {
      const first = (u.first_name as any) || ""; const last = (u.last_name as any) || "";
      const combo = `${first} ${last}`.trim();
      const email = (u.email as any) || "";
      m[String(u.id)] = combo || email || String(u.id);
    }
    return m;
  }, [users]);

  async function load(off: number) {
    setLoading(true);
    try { setRows(await fetchAuditPage(limit, off)); } finally { setLoading(false); setOffset(off); }
  }
  useEffect(() => { load(0); }, []);

  const labelName = (e:any) => {
    if (e.actor_user_id && nameById[e.actor_user_id]) return nameById[e.actor_user_id];
    const n = [e.actor_first_name, e.actor_last_name].filter(Boolean).join(" ").trim();
    if (n) return n;
    if (e.actor_email) return e.actor_email;
    return e.entity_id || "";
  };

  return (
    <div className="overflow-auto border rounded panel-2">
      <table className="table">
        <thead><tr><th>When</th><th>ID</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>
          {rows.map((e, i) => (
            <tr key={e.id || `audit-${i}`}>
              <td>{e.created_at ? new Date(e.created_at).toLocaleString() : ""}</td>
              <td>{labelName(e)}</td>
              <td>{e.actor_user_id || ""}</td>
              <td>{e.action || ""}</td>
              <td>{e.entity_type || ""}</td>
            </tr>
          ))}
          {rows.length === 0 && !loading ? <tr><td colSpan={5} style={{ textAlign:"center", padding:16 }}>No events</td></tr> : null}
        </tbody>
      </table>
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <label className="label">Page size</label>
          <select className="input" value={limit} onChange={e=>{ const v = parseInt(e.target.value,10)||50; setLimit(v); load(0); }}>
            <option value={25}>25</option><option value={50}>50</option><option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn ghost" onClick={()=> load(Math.max(0, offset - limit))} disabled={offset===0}>Prev</button>
          <button className="btn" onClick={()=> load(offset + limit)} disabled={rows.length < limit}>Next</button>
        </div>
      </div>
    </div>
  );
}
