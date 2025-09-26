
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMyReferrals, fetchActivity, patchReferralAgent } from "../../lib/api";

type Ref = { id: string; ref_no: string; company: string; status: string; notes?: string | null; contact_name?:string; contact_email?:string; contact_phone?:string };

const Card = ({children}:{children:React.ReactNode}) => <div className="card">{children}</div>;

export default function Dashboard(){
  const router = useRouter();
  const [referrals,setReferrals]=useState<Ref[]>([]);
  const [selected,setSelected]=useState<string>("overview");
  const [activity,setActivity]=useState<any[]>([]);
  const [counts,setCounts]=useState<Record<string,number>>({});
  const [editOpen,setEditOpen]=useState(false);
  const selRef = useMemo(()=> referrals.find(r=>r.id===selected), [selected, referrals]);
  const [company,setCompany]=useState(""); const [cname,setCname]=useState(""); const [cemail,setCemail]=useState(""); const [cphone,setCphone]=useState(""); const [notes,setNotes]=useState("");

  useEffect(()=>{
    (async()=>{
      try{
        const refs = await fetchMyReferrals(); setReferrals(refs);
        const c:Record<string,number>={New:0,Contacted:0,Qualified:0,"Proposal Sent":0,Won:0,Lost:0,"On Hold":0,"Commission Paid":0};
        refs.forEach(r=> c[r.status]=(c[r.status]||0)+1); setCounts(c);
        const role = typeof window!=='undefined' ? localStorage.getItem('role') : null;
        setActivity(role==="COVENANT" ? await fetchActivity() : []);
      }catch{ router.push("/"); }
    })();
  },[router]);

  useEffect(()=>{ if(selRef){ setCompany(selRef.company||""); setCname(selRef.contact_name||""); setCemail(selRef.contact_email||""); setCphone(selRef.contact_phone||""); setNotes(selRef.notes||""); }},[selRef]);

  async function save(){
    if(!selRef) return;
    await patchReferralAgent(selRef.id, { company, contact_name:cname, contact_email:cemail, contact_phone:cphone, notes });
    setReferrals(prev=>prev.map(r=>r.id===selRef.id?({...r, company, contact_name:cname, contact_email:cemail, contact_phone:cphone, notes}):r));
    setEditOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button className="btn secondary" onClick={()=> selected==='overview'? alert('Select a referral first'): setEditOpen(true)}>Edit</button>
          <Link className="btn" href="/referral">Submit Referral</Link>
        </div>
      </div>

      {/* selector row */}
      <Card>
        <div className="flex flex-wrap gap-2">
          <button className={`btn secondary ${selected==='overview'?'active':''}`} onClick={()=>setSelected('overview')}>All Referrals Overview</button>
          {referrals.map(r=>(
            <button key={r.id} className={`btn secondary ${selected===r.id?'active':''}`} onClick={()=>setSelected(r.id)} title={r.company}>{r.ref_no||r.company}</button>
          ))}
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(counts).map(([k,v])=> (
          <div key={k} className="card">
            <div className="text-sm muted">{k}</div>
            <div className="text-2xl font-extrabold mt-1">{v}</div>
          </div>
        ))}
      </div>

      {/* Selected referral quick facts */}
      {selected!=='overview' && selRef && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><div className="text-sm muted">Referral #</div><div className="text-xl font-bold">{selRef.ref_no}</div></Card>
          <Card><div className="text-sm muted">Company</div><div className="text-xl font-bold">{selRef.company}</div></Card>
          <Card><div className="text-sm muted">Status</div><div className="text-xl font-bold">{selRef.status}</div></Card>
        </div>
      )}

      {/* Activity + Enablement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3"><h2 className="font-semibold">Recent Activity</h2>
            <span className="badge">{selected==='overview'?'All My Referrals':(selRef?.ref_no||selRef?.company)}</span>
          </div>
          <div className="max-h-[360px] overflow-auto">
            <table className="table">
              <thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>Time</th></tr></thead>
              <tbody>
                {activity.filter(a=> selected==='overview' || a.entity_id===selected).map((a:any,i:number)=>(
                  <tr key={i}><td className="p-2">{a.action}</td><td className="p-2">{a.entity_type}</td><td className="p-2">{a.entity_id||'—'}</td><td className="p-2">{new Date(a.created_at).toLocaleString()}</td></tr>
                ))}
                {activity.length===0 && <tr><td className="p-2 muted" colSpan={4}>No activity yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="md:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><h2 className="font-semibold mb-3">Enablement</h2>
              <div className="flex flex-col gap-2">
                <a className="btn" href="/assets/program_overview.zip">Download Program Overview</a>
                <a className="btn" href="/assets/agent_sales_kit.zip">Download Sales Kit</a>
                <a className="btn" href="/assets/quick_pricing_reference.pdf">Pricing Reference Guide</a>
              </div>
            </Card>
            <Card><h2 className="font-semibold mb-3">Announcements</h2>
              <div className="space-y-2 muted text-sm">
                <div>Q1 Commission bonus program now live.</div>
                <div>New product launch—resources updated.</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {editOpen && selRef && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={()=>setEditOpen(false)}>
          <div className="card w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
              <input className="input" placeholder="Contact Name" value={cname} onChange={e=>setCname(e.target.value)} />
              <input className="input" type="email" placeholder="Contact Email" value={cemail} onChange={e=>setCemail(e.target.value)} />
              <input className="input" placeholder="Contact Phone" value={cphone} onChange={e=>setCphone(e.target.value)} />
            </div>
            <textarea className="input w-full mt-3 min-h-[120px]" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
