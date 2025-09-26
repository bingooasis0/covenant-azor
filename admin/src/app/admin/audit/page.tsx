
"use client";
import { useEffect, useState } from "react";
import { api, authHeader } from "../../../lib/api";
type Ev = { id:string; actor_user_id:string|null; action:string; entity_type:string; entity_id:string|null; created_at:string };
export default function Audit(){
  const [rows,setRows]=useState<Ev[]>([]);
  async function load(){ try{ const res=await api.get("/audit/events?limit=50", { headers: authHeader() }); setRows(res.data); }catch{} }
  useEffect(()=>{ load(); },[]);
  return (<div className="space-y-6"><h2 className="text-xl font-semibold">Audit Logs</h2>
    <div className="card overflow-auto"><table className="table"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Entity ID</th></tr></thead><tbody>
      {rows.map(e=>(<tr key={e.id}><td>{new Date(e.created_at).toLocaleString()}</td><td>{e.actor_user_id||"system"}</td><td>{e.action}</td><td>{e.entity_type}</td><td>{e.entity_id||"—"}</td></tr>))}
    </tbody></table></div></div>);
}
