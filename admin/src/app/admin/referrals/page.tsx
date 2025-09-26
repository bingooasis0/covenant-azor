
"use client";
import { useEffect, useState } from "react";
import { api, authHeader } from "../../../lib/api";
import { useToast } from "../../../components/Toast";
type Ref = { id:string; ref_no:string; company:string; status:string; notes?:string|null };
const STATUSES = ["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"];
export default function Referrals(){
  const [list,setList]=useState<Ref[]>([]);
  const [note,setNote]=useState(""); const toast = useToast();
  async function load(){ try{ const res=await api.get("/admin/referrals", { headers: authHeader() }); setList(res.data); }catch{ toast.push({type:"error", text:"Load failed"});} }
  useEffect(()=>{ load(); },[]);
  async function updateStatus(id:string, status:string){ try{ await api.patch(`/admin/referrals/${id}`, { status }, { headers: authHeader() }); toast.push({type:"success", text:"Updated"}); await load(); }catch{ toast.push({type:"error", text:"Update failed"});} }
  async function addNote(id:string){ try{ await api.post(`/admin/referrals/${id}/note`, { note }, { headers: authHeader() }); setNote(""); toast.push({type:"success", text:"Note added"}); await load(); }catch{ toast.push({type:"error", text:"Add note failed"});} }
  async function email(id:string){ try{ await api.post(`/admin/referrals/${id}/email`, { subject:"Update", body:"Hello from Covenant" }, { headers: authHeader() }); toast.push({type:"success", text:"Email sent"});}catch{ toast.push({type:"error", text:"Email failed"});} }
  return (<div className="space-y-6"><h2 className="text-xl font-semibold">Referrals</h2>
    <div className="card overflow-auto"><table className="table"><thead><tr><th>Ref #</th><th>Company</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead><tbody>
      {list.map(r=>(<tr key={r.id}><td>{r.ref_no}</td><td>{r.company}</td><td>{r.status}</td><td>{r.notes||"—"}</td>
      <td className="space-x-2"><select className="border p-1 rounded" defaultValue={r.status} onChange={e=>updateStatus(r.id, e.target.value)}>{STATUSES.map(s=><option key={s} value={s}>{s}</option>)}</select>
      <input className="border p-1 rounded" placeholder="Note" value={note} onChange={e=>setNote(e.target.value)} />
      <button className="btn btn-accent" onClick={()=>addNote(r.id)}>Add</button>
      <button className="btn btn-secondary" onClick={()=>email(r.id)}>Email</button></td></tr>))}
    </tbody></table></div></div>);
}
