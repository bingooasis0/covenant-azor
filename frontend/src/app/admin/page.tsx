// frontend/src/app/admin/page.tsx
"use client";

import { useRequireRole } from "@/hooks/useRequireRole";
import { useEffect, useMemo, useState } from "react";
import {
  adminListUsers, adminCreateUser, adminDeleteUser, adminResetUserPassword, adminResetUserMfa,
  adminListReferrals, adminUpdateReferral, adminDeleteReferral
} from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { IconEdit, IconTrash, IconUserPlus, IconEye, IconKey, IconShield } from "@/lib/icons";

type User = { id: string; email: string; first_name: string; last_name: string; role: "AZOR"|"COVENANT" };
type Referral = { id: string; ref_no: string; company: string; status: string; created_at: string; contact_name?: string; contact_email?: string; contact_phone?: string; notes?: string };

export default function AdminPage() {
  const ok = useRequireRole("COVENANT");

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // User modals
  const [showInvite, setShowInvite] = useState(false);
  const [showEditUser, setShowEditUser] = useState<User | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);

  // Referral modal
  const [viewReferral, setViewReferral] = useState<Referral | null>(null);

  useEffect(() => {
    if (!ok) return;
    (async () => {
      setUsers(await adminListUsers());
      setReferrals(await adminListReferrals());
    })();
  }, [ok]);

  if (!ok) return <div className="p-6 text-sm">Loading…</div>;

  return (
    <div className="p-6 space-y-8" style={{ maxWidth: "1200px" }}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
        <Button onClick={() => setShowInvite(true)}><IconUserPlus className="icon" />Invite User</Button>
      </div>

      {/* Users */}
      <section>
        <h2 className="text-lg font-medium mb-2">Users</h2>
        <div className="overflow-auto border rounded panel-2">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th><th>Name</th><th>Role</th><th style={{width:160}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.first_name} {u.last_name}</td>
                  <td>{u.role}</td>
                  <td>
                    <div className="flex gap-6">
                      <button className="btn ghost" onClick={() => setShowEditUser(u)}><IconEdit className="icon" />Edit</button>
                      <button className="btn danger" onClick={() => setConfirmDeleteUser(u)}><IconTrash className="icon" />Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={4} className="text-gray-500 p-2">No users</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Referrals */}
      <section>
        <h2 className="text-lg font-medium mb-2">Referrals</h2>
        <div className="overflow-auto border rounded panel-2">
          <table className="table">
            <thead>
              <tr>
                <th>Ref No</th><th>Company</th><th>Status</th><th>Created</th><th style={{width:120}}>View</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map((r) => (
                <tr key={r.id}>
                  <td>{r.ref_no}</td>
                  <td>{r.company}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td><button className="btn ghost" onClick={() => setViewReferral(r)}><IconEye className="icon" />View</button></td>
                </tr>
              ))}
              {referrals.length === 0 && <tr><td colSpan={5} className="text-gray-500 p-2">No referrals</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {/* Invite User Modal */}
      <InviteUserModal open={showInvite} onClose={() => setShowInvite(false)} onCreated={async () => {
        setShowInvite(false);
        setUsers(await adminListUsers());
      }} />

      {/* Edit User Modal */}
      <EditUserModal user={showEditUser} onClose={() => setShowEditUser(null)} onUpdated={async () => {
        setShowEditUser(null);
        setUsers(await adminListUsers());
      }} />

      {/* Confirm delete user */}
      <Modal open={!!confirmDeleteUser} title="Confirm delete" onClose={() => setConfirmDeleteUser(null)}
        footer={<>
          <Button tone="ghost" onClick={() => setConfirmDeleteUser(null)}>Cancel</Button>
          <Button tone="danger" onClick={async () => {
            if (confirmDeleteUser) { await adminDeleteUser(confirmDeleteUser.id); setUsers(await adminListUsers()); setConfirmDeleteUser(null); }
          }}>Delete</Button>
        </>}>
        <p>Are you sure you want to delete <b>{confirmDeleteUser?.email}</b>?</p>
      </Modal>

      {/* Referral viewer/editor */}
      <ReferralModal referral={viewReferral} onClose={() => setViewReferral(null)} onChanged={async () => {
        setReferrals(await adminListReferrals());
      }} />
    </div>
  );
}

function InviteUserModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email:"", first_name:"", last_name:"", role:"AZOR", password:"" });
  return (
    <Modal open={open} title="Invite user" onClose={onClose} footer={<>
      <Button tone="ghost" onClick={onClose}>Cancel</Button>
      <Button onClick={async () => { await adminCreateUser(form); onCreated(); }}>Create</Button>
    </>}>
      <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div><label className="label">Email</label><input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
        <div><label className="label">Role</label>
          <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="AZOR">AZOR</option>
            <option value="COVENANT">COVENANT</option>
          </select>
        </div>
        <div><label className="label">First name</label><input className="input" value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} /></div>
        <div><label className="label">Last name</label><input className="input" value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} /></div>
        <div style={{gridColumn:"1 / -1"}}><label className="label">Temporary password</label><input className="input" type="password" autoComplete="new-password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
      </div>
    </Modal>
  );
}

function EditUserModal({ user, onClose, onUpdated }: { user: User | null; onClose: () => void; onUpdated: () => void }) {
  const [form, setForm] = useState<User | null>(user);
  const [newPass, setNewPass] = useState("");
  useEffect(()=>setForm(user),[user]);
  return (
    <Modal open={!!user} title={`Edit user`} onClose={onClose} footer={<>
      <Button tone="ghost" onClick={onClose}>Close</Button>
      {form && <Button onClick={async ()=>{ await adminCreateUser({ ...form, id: form.id }); onUpdated(); }}><IconEdit className="icon" />Save</Button>}
    </>}>
      {form && (
        <div className="space-y-4">
          <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div><label className="label">Email</label><input className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e=>setForm({...form, role:e.target.value as any})}>
                <option value="AZOR">AZOR</option>
                <option value="COVENANT">COVENANT</option>
              </select>
            </div>
            <div><label className="label">First name</label><input className="input" value={form.first_name} onChange={e=>setForm({...form, first_name:e.target.value})} /></div>
            <div><label className="label">Last name</label><input className="input" value={form.last_name} onChange={e=>setForm({...form, last_name:e.target.value})} /></div>
          </div>
          <div className="flex gap-8">
            <Button className="btn" onClick={async ()=>{ if(!form) return; await adminResetUserMfa(form.id); }}><IconShield className="icon" />Reset Multi Factor Authentication</Button>
            <div className="flex items-center gap-2">
              <input className="input" placeholder="New password" type="password" autoComplete="new-password" value={newPass} onChange={e=>setNewPass(e.target.value)} />
              <Button onClick={async ()=>{ if(!form) return; await adminResetUserPassword(form.id, newPass); setNewPass(""); }}><IconKey className="icon" />Set password</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function ReferralModal({ referral, onClose, onChanged }:{ referral: Referral|null; onClose:()=>void; onChanged:()=>void }){
  const [form, setForm] = useState<Referral | null>(referral);
  useEffect(()=>setForm(referral),[referral]);
  if(!referral) return null;
  return (
    <Modal open={!!referral} title={`Referral ${referral.ref_no}`} onClose={onClose} footer={<>
      <Button tone="ghost" onClick={onClose}>Close</Button>
      {form && <Button onClick={async ()=>{ await adminUpdateReferral(form.id, { company: form.company, status: form.status, contact_name: form.contact_name, contact_email: form.contact_email, contact_phone: form.contact_phone, notes: form.notes }); onChanged(); onClose(); }}><IconEdit className="icon" />Save</Button>}
      <Button tone="danger" onClick={async ()=>{ await adminDeleteReferral(referral.id); onChanged(); onClose(); }}><IconTrash className="icon" />Delete</Button>
    </>}>
      {form && (
        <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label className="label">Company</label><input className="input" value={form.company} onChange={e=>setForm({...form, company:e.target.value})} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
              <option>New</option><option>Contacted</option><option>Won</option><option>Lost</option><option>Commission Paid</option>
            </select>
          </div>
          <div><label className="label">Contact name</label><input className="input" value={form.contact_name ?? ""} onChange={e=>setForm({...form, contact_name:e.target.value})} /></div>
          <div><label className="label">Contact email</label><input className="input" value={form.contact_email ?? ""} onChange={e=>setForm({...form, contact_email:e.target.value})} /></div>
          <div><label className="label">Contact phone</label><input className="input" value={form.contact_phone ?? ""} onChange={e=>setForm({...form, contact_phone:e.target.value})} /></div>
          <div style={{gridColumn:"1 / -1"}}><label className="label">Notes</label><textarea className="input" rows={4} value={form.notes ?? ""} onChange={e=>setForm({...form, notes:e.target.value})} /></div>
        </div>
      )}
    </Modal>
  );
}
