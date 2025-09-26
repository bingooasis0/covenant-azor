
"use client";
import { useEffect, useState } from "react";
import { api, authHeader } from "../../../lib/api";

type Ref = { id:string; ref_no:string; company:string; status:string; notes?:string|null };

const STATUSES = ["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"];

export default function Referrals(){
  const [list,setList]=useState<Ref[]>([]);
  const [note,setNote]=useState("");
  async function load(){ const res = await api.get("/admin/referrals", { headers: authHeader() }); setList(res.data); }
  useEffect(()=>{ load(); },[]);
  async function updateStatus(id:string, status:string){ await api.patch(`/admin/referrals/${id}`, { status }, { headers: authHeader() }); await load(); }
  async function addNote(id:string){ await api.post(`/admin/referrals/${id}/note`, { note }, { headers: authHeader() }); setNote(""); await load(); }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Referrals</h2>
      <div className="card">
        <table className="table">
          <thead><tr><th>Ref #</th><th>Company</th><th>Status</th><th>Notes</th><th>Update</th></tr></thead>
          <tbody>
            {list.map(r=>(
              <tr key={r.id}>
                <td>{r.ref_no}</td><td>{r.company}</td><td>{r.status}</td>
                <td>{r.notes||"—"}</td>
                <td className="space-x-2">
                  <select className="border p-1 rounded" defaultValue={r.status} onChange={e=>updateStatus(r.id, e.target.value)}>
                    {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                  <input className="border p-1 rounded" placeholder="Add note" value={note} onChange={e=>setNote(e.target.value)} />
                  <button className="btn btn-accent" onClick={()=>addNote(r.id)}>Add</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
