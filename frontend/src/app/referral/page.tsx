
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useToast } from "../../components/Toast";
import { fetchMyReferrals, patchReferralAgent } from "../../lib/api";

type Ref = { id:string; ref_no:string; company:string; status:string; notes?:string|null; contact_name?:string; contact_email?:string; contact_phone?:string };

export default function ReferralDashboard(){
  const { push } = useToast();
  const [rows,setRows]=useState<Ref[]>([]);
  const [sel,setSel]=useState<string>("");
  const selRef = useMemo(()=> rows.find(r=>r.id===sel), [sel, rows]);

  const [q,setQ]=useState(""); const [status,setStatus]=useState("ALL"); const [sort,setSort]=useState<"recent"|"company"|"status">("recent");
  const [edit,setEdit]=useState(false);
  const [company,setCompany]=useState(""); const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [phone,setPhone]=useState(""); const [notes,setNotes]=useState("");

  useEffect(()=>{ (async()=>{ try{ const d=await fetchMyReferrals(); setRows(d); if(d.length) setSel(d[0].id);}catch{ push({type:"error", text:"Auth required"});} })(); },[push]);
  useEffect(()=>{ if(selRef){ setCompany(selRef.company||""); setName(selRef.contact_name||""); setEmail(selRef.contact_email||""); setPhone(selRef.contact_phone||""); setNotes(selRef.notes||""); }},[selRef]);

  async function save(){
    if(!selRef) return;
    try{
      await patchReferralAgent(selRef.id, { company, contact_name:name, contact_email:email, contact_phone:phone, notes });
      setRows(prev=>prev.map(r=>r.id===selRef.id ? ({...r, company, contact_name:name, contact_email:email, contact_phone:phone, notes}) : r));
      setEdit(false); push({type:"success", text:"Referral updated"});
    }catch(e:any){ push({type:"error", text:e?.response?.data?.detail || "Save failed"}); }
  }

  const filtered = useMemo(()=>{
    let list = rows;
    if(q.trim()){ const t=q.trim().toLowerCase();
      list = list.filter(r=>(r.ref_no||"").toLowerCase().includes(t) || (r.company||"").toLowerCase().includes(t) ||
                               (r.contact_name||"").toLowerCase().includes(t) || (r.contact_email||"").toLowerCase().includes(t));
    }
    if(status!=="ALL") list = list.filter(r=>r.status===status);
    if(sort==="company") list=[...list].sort((a,b)=>a.company.localeCompare(b.company));
    if(sort==="status")  list=[...list].sort((a,b)=>a.status.localeCompare(b.status));
    return list;
  },[rows,q,status,sort]);

  const StatusPill = ({ s }: { s: string }) => (
    <span className="px-2 py-1 rounded-full text-xs" style={{background:"#fff", border:"1px solid var(--border)", color:"#334155"}}>{s}</span>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Referral</h1>
        <Link href="/create-referral" className="btn">Create new</Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input className="input" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="ALL">All statuses</option>
            {["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"].map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={sort} onChange={e=>setSort(e.target.value as any)}>
            <option value="recent">Sort: Recent</option>
            <option value="company">Sort: Company</option>
            <option value="status">Sort: Status</option>
          </select>
          <button className="btn secondary" onClick={()=>{setQ(""); setStatus("ALL"); setSort("recent");}}>Reset</button>
        </div>

        <table className="table">
          <thead><tr><th>Ref #</th><th>Company</th><th>Status</th><th className="w-0"></th></tr></thead>
          <tbody>
          {filtered.map(r=>(
            <tr key={r.id} className={sel===r.id?"bg-white/40":""}>
              <td className="p-2">{r.ref_no}</td>
              <td className="p-2">{r.company}</td>
              <td className="p-2"><StatusPill s={r.status} /></td>
              <td className="p-2 flex justify-end gap-2">
                <button className="btn secondary" onClick={()=>{setSel(r.id); setEdit(true);}}>Edit</button>
                <button className="btn secondary" onClick={()=>setSel(r.id)}>View</button>
              </td>
            </tr>
          ))}
          {filtered.length===0 && <tr><td colSpan={4} className="p-3 text-sm text-[var(--muted)]">No referrals match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Details</h3>
        {!selRef ? <div className="text-sm text-[var(--muted)]">Select a referral to view details.</div> :
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><div className="text-sm text-[var(--muted)]">Referral #</div><div className="text-lg font-bold">{selRef.ref_no}</div></div>
            <div><div className="text-sm text-[var(--muted)]">Status</div><StatusPill s={selRef.status} /></div>
            <div><div className="text-sm text-[var(--muted)]">Company</div><div className="text-lg">{selRef.company}</div></div>
            <div><div className="text-sm text-[var(--muted)]">Primary Contact</div>
              <div className="text-lg">{selRef.contact_name||"—"}</div>
              <div className="text-sm">{selRef.contact_email||"—"}</div>
              <div className="text-sm">{selRef.contact_phone||"—"}</div>
            </div>
            <div className="md:col-span-2"><div className="text-sm text-[var(--muted)]">Notes</div><div className="text-sm whitespace-pre-wrap">{selRef.notes||"—"}</div></div>
          </div>
        }
      </div>

      {edit && selRef && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-index-50" onClick={()=>setEdit(false)}>
          <div className="card w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Edit {selRef.ref_no}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
              <input className="input" placeholder="Contact Name" value={name} onChange={e=>setName(e.target.value)} />
              <input className="input" type="email" placeholder="Contact Email" value={email} onChange={e=>setEmail(e.target.value)} />
              <input className="input" placeholder="Contact Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <textarea className="input w-full mt-3 min-h-[120px]" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn secondary" onClick={()=>setEdit(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
