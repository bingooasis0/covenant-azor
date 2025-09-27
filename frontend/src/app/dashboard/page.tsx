// frontend/src/app/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "../../components/ui/Badge";
import { fetchMyReferrals, fetchActivity } from "../../lib/api/index";

type Ref = { id: string; ref_no: string; company: string; status: string; created_at?: string; contact_name?:string; contact_email?:string; contact_phone?:string; notes?:string };

const Card = ({children}:{children:React.ReactNode}) => <div className="card">{children}</div>;

export default function Dashboard(){
  const [referrals,setReferrals]=useState<Ref[]>([]);
  const [activity,setActivity]=useState<any[]>([]);
  const [selectedId,setSelectedId]=useState<string>("");

  useEffect(()=>{
    (async()=>{
      try{ setReferrals(await fetchMyReferrals()); }catch{ setReferrals([]); }
      try{ setActivity(await fetchActivity(10)); }catch{ setActivity([]); }
    })();
  },[]);

  const counts = useMemo(()=>{
    const m:Record<string,number>={}; referrals.forEach(r=>{ m[r.status]=(m[r.status]||0)+1; }); return m;
  },[referrals]);

  const recentRefs = useMemo(()=> referrals.slice(0,6), [referrals]);
  const sel = useMemo(()=> referrals.find(r=>r.id===selectedId)||null, [selectedId, referrals]);

  return (
    <div className="wrap space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Link className="btn" href="/create-referral">Submit Referral</Link>
      </div>

      {/* Announcements */}
      <Card>
        <h2 className="text-lg font-medium mb-2">Announcements</h2>
        <p>➤ Set to launch in Q4 on a 90 day soft lauch.</p>
        <p>➤ Test announcement</p>
      </Card>

      {/* All Referrals Overview with selectable chips */}
      <Card>
        <h2 className="text-lg font-medium mb-2">All Referrals Overview</h2>
        <div className="flex flex-wrap gap-2">
          <button className={`badge ${selectedId===""?"active":""}`} onClick={()=>setSelectedId("")}>All</button>
          {recentRefs.map(r => (
            <button key={r.id} className={`badge ${selectedId===r.id?"active":""}`} onClick={()=>setSelectedId(r.id)}>
              {r.ref_no}
            </button>
          ))}
        </div>

        {/* Details for selected referral */}
        {sel && (
          <div className="mt-4 border rounded panel-2 p-3">
            <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
              <div><div className="label">Ref No</div><div style={{fontWeight:600}}>{sel.ref_no}</div></div>
              <div><div className="label">Status</div><Badge status={sel.status} /></div>
              <div><div className="label">Company</div><div style={{fontWeight:600}}>{sel.company}</div></div>
              <div><div className="label">Created</div><div>{sel.created_at? new Date(sel.created_at).toLocaleString():""}</div></div>
              <div><div className="label">Contact name</div><div>{sel.contact_name||"-"}</div></div>
              <div><div className="label">Contact email</div><div>{sel.contact_email||"-"}</div></div>
              <div><div className="label">Contact phone</div><div>{sel.contact_phone||"-"}</div></div>
              <div className="col-span-2"><div className="label">Notes</div><div>{sel.notes||"-"}</div></div>
            </div>
          </div>
        )}
      </Card>

      {/* My Referrals table */}
      <Card>
        <h2 className="text-lg font-medium mb-2">My Referrals</h2>
        <div className="overflow-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Ref No</th><th>Company</th><th>Status</th><th>Created</th><th style={{width:80}}>View</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id}>
                  <td>{r.ref_no}</td>
                  <td>{r.company}</td>
                  <td><Badge status={r.status} /></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ""}</td>
                  <td><Link className="btn ghost" href={`/referral?id=${r.id}`}>View</Link></td>
                </tr>
              ))}
              {referrals.length===0 && <tr><td colSpan={5} style={{textAlign:"center", padding:"16px"}}>No referrals yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Activity full width */}
      <Card>
        <h2 className="text-lg font-medium mb-2">Recent Activity</h2>
        {activity.length===0 ? (
          <div className="text-sm text-gray-600">No activity yet.</div>
        ) : (
          <table className="table">
            <thead><tr><th>Action</th><th>Entity</th><th>Entity ID</th><th>Time</th></tr></thead>
            <tbody>
              {activity.map((a:any)=> (
                <tr key={a.id}><td>{a.action}</td><td>{a.entity_type}</td><td>{a.entity_id}</td><td>{new Date(a.created_at).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Status Summary at bottom */}
      <Card>
        <h2 className="text-lg font-medium mb-2">Status Summary</h2>
        <div className="grid" style={{display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:12}}>
          {["New","Contacted","Qualified","Proposal Sent","Won","Lost","On Hold","Commission Paid"].map(s => (
            <div key={s} className="card" style={{padding:12}}>
              <div className="label">{s}</div>
              <div style={{fontSize:22, fontWeight:700}}>{counts[s]||0}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
