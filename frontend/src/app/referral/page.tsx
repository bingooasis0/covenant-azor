/* frontend/src/app/referral/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  fetchMyReferrals,
  patchReferralAgent,
  adminUpdateReferral,
  getReferralFiles,
  uploadReferralFiles,
  deleteReferralFile,
  type Referral
} from "@/lib/api";

export default function ReferralPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string>("");

  // deep edit modal parity with Admin
  const [editOpen, setEditOpen] = useState(false);
  const [ef, setEf] = useState<any>({});
  const [files, setFiles] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const role = typeof window !== "undefined" ? (localStorage.getItem("role") || "AZOR") : "AZOR";

  const selRef = useMemo(() => rows.find((r) => r.id === sel), [sel, rows]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyReferrals();
        setRows(data);
        if (data.length) setSel(data[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load referrals");
      }
    })();
  }, []);

  function openEdit(r: Referral) {
    setSel(r.id);
    setEf({
      company: r.company || "",
      status: r.status || "New",
      contact_name: r.contact_name || "",
      contact_email: r.contact_email || "",
      contact_phone: r.contact_phone || "",
      notes: r.notes || "",
      locationsCsv: "",
      env_users: "", env_phone_provider: "", env_isp: "", env_bandwidth: "", env_it_model: "",
    });
    (async () => {
      try { setFiles(await getReferralFiles(r.id) as any); } catch { setFiles([]); }
    })();
    setEditOpen(true);
  }

  async function save() {
    if (!selRef) return;
    setError(null);
    try {
      if (role === "COVENANT") {
        const body:any = {
          company: ef.company, status: ef.status,
          contact_name: ef.contact_name, contact_email: ef.contact_email, contact_phone: ef.contact_phone,
          notes: ef.notes || null,
        };
        if (ef.locationsCsv?.trim()) body.locations = ef.locationsCsv.split(",").map((s:string)=>s.trim()).filter(Boolean);
        body.environment = {
          users: ef.env_users ? Number(ef.env_users) : undefined,
          phone_provider: ef.env_phone_provider || undefined,
          internet_provider: ef.env_isp || undefined,
          internet_bandwidth_mbps: ef.env_bandwidth ? Number(ef.env_bandwidth) : undefined,
          it_model: ef.env_it_model || undefined,
        };
        const updated = await adminUpdateReferral(selRef.id, body);
        setRows((prev) => prev.map((r) => r.id === selRef.id ? { ...r, ...updated } : r));
      } else {
        await patchReferralAgent(selRef.id, {
          company: ef.company,
          contact_name: ef.contact_name,
          contact_email: ef.contact_email,
          contact_phone: ef.contact_phone,
          notes: ef.notes,
        });
        setRows((prev) => prev.map((r) => r.id === selRef.id ? { ...r, ...ef } : r));
      }

      if (role === "COVENANT" && newFiles.length > 0) {
        await uploadReferralFiles(selRef.id, newFiles);
        setFiles(await getReferralFiles(selRef.id) as any);
        setNewFiles([]);
      }
      setEditOpen(false);
    } catch (e:any) {
      setError(e?.message || "Save failed");
    }
  }

  async function removeFile(fid: string) {
    if (!selRef) return;
    try {
      await deleteReferralFile(selRef.id, fid);
      setFiles(prev => prev.filter((f:any) => f.file_id !== fid));
    } catch (e:any) { setError(e?.message || "Remove failed"); }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Referral</h1>
        <a href="/create-referral" className="btn">Create Referral</a>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full text-sm table">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left border-b">Ref #</th>
              <th className="px-3 py-2 text-left border-b">Company</th>
              <th className="px-3 py-2 text-left border-b">Status</th>
              <th className="px-3 py-2 text-left border-b">Contact</th>
              <th className="px-3 py-2 text-left border-b">Email</th>
              <th className="px-3 py-2 text-left border-b">Phone</th>
              <th className="px-3 py-2 text-left border-b">Created</th>
              <th className="px-3 py-2 text-right border-b w-0">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">{r.ref_no}</td>
                <td className="px-3 py-2">{r.company}</td>
                <td className="px-3 py-2"><Badge status={r.status || "New"} /></td>
                <td className="px-3 py-2">{r.contact_name || "-"}</td>
                <td className="px-3 py-2">{r.contact_email || "-"}</td>
                <td className="px-3 py-2">{r.contact_phone || "-"}</td>
                <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="btn ghost" onClick={()=>openEdit(r)}>Edit</button>
                    <a className="btn ghost" href={`/referral`}>View</a>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No referrals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Deep edit modal, role-aware */}
      {editOpen && selRef && (
        <div className="modal-backdrop" onClick={()=>setEditOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>
            <header><div>Edit {selRef.ref_no}</div><button className="btn ghost" onClick={()=>setEditOpen(false)}>Close</button></header>
            <section className="space-y-3">
              {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium mb-1">Company</label><input className="input w-full" value={ef.company} onChange={e=>setEf((p:any)=>({...p,company:e.target.value}))} /></div>
                <div><label className="block text-sm font-medium mb-1">Status</label>
                  <select className="input w-full" value={ef.status} onChange={e=>setEf((p:any)=>({...p,status:e.target.value}))} disabled={role!=="COVENANT"}>
                    {["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Contact Name</label><input className="input w-full" value={ef.contact_name} onChange={e=>setEf((p:any)=>({...p,contact_name:e.target.value}))} /></div>
                <div><label className="block text-sm font-medium mb-1">Contact Email</label><input type="email" className="input w-full" value={ef.contact_email} onChange={e=>setEf((p:any)=>({...p,contact_email:e.target.value}))} /></div>
                <div><label className="block text sm font-medium mb-1">Contact Phone</label><input className="input w-full" value={ef.contact_phone} onChange={e=>setEf((p:any)=>({...p,contact_phone:e.target.value}))} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Locations (CSV)</label><input className="input w-full" value={ef.locationsCsv} onChange={e=>setEf((p:any)=>({...p,locationsCsv:e.target.value}))} placeholder="NYC, Boston, ..." disabled={role!=="COVENANT"} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Notes</label><textarea className="input w-full min-h-[120px]" value={ef.notes} onChange={e=>setEf((p:any)=>({...p,notes:e.target.value}))} /></div>
              </div>

              {role==="COVENANT" && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><label className="block text-sm font-medium mb-1">Users</label><input className="input w-full" type="number" inputMode="numeric" value={ef.env_users} onChange={e=>setEf((p:any)=>({...p,env_users:e.target.value}))} /></div>
                    <div><label className="block text-sm font-medium mb-1">Phone provider</label><input className="input w-full" value={ef.env_phone_provider} onChange={e=>setEf((p:any)=>({...p,env_phone_provider:e.target.value}))} /></div>
                    <div><label className="block text-sm font-medium mb-1">Internet provider</label><input className="input w-full" value={ef.env_isp} onChange={e=>setEf((p:any)=>({...p,env_isp:e.target.value}))} /></div>
                    <div><label className="block text-sm font-medium mb-1">Bandwidth (Mbps)</label><input className="input w-full" type="number" inputMode="decimal" value={ef.env_bandwidth} onChange={e=>setEf((p:any)=>({...p,env_bandwidth:e.target.value}))} /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">IT support model</label><input className="input w-full" value={ef.env_it_model} onChange={e=>setEf((p:any)=>({...p,env_it_model:e.target.value}))} /></div>
                  </div>

                  <div className="font-semibold">Files</div>
                  {files.length===0 ? <div className="text-sm text-[var(--muted)]">No files</div> :
                    <ul className="text-sm list-disc ml-5">
                      {files.map((f:any) => (
                        <li key={f.file_id} className="flex items-center justify-between gap-3">
                          <span>{f.name} ({f.size} bytes)</span>
                          <button className="btn ghost" onClick={()=>removeFile(f.file_id)}>Remove</button>
                        </li>
                      ))}
                    </ul>
                  }
                  <div>
                    <input className="block w-full text-sm" type="file" multiple accept="*/*" onChange={(e)=>setNewFiles(e.target.files?Array.from(e.target.files):[])} />
                    <div className="text-xs text-gray-600 mt-1">Add files. Any type.</div>
                  </div>
                </>
              )}
            </section>
            <footer>
              <button className="btn ghost" onClick={()=>setEditOpen(false)}>Cancel</button>
              <button className="btn" onClick={save}>{role==="COVENANT" ? "Save changes" : "Save allowed fields"}</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
