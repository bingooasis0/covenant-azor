
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

type Row = { id:string; ref_no:string; company:string; status:string; notes?:string|null };

export default function DashboardPage(){
  const router = useRouter();
  const [rows,setRows]=useState<Row[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|undefined>();

  async function load(){
    const token = localStorage.getItem("token");
    if(!token){ router.push("/"); return; }
    try{
      const res = await api.get("/referrals/my", { headers:{ Authorization:`Bearer ${token}` }});
      setRows(res.data as Row[]);
    }catch(e:any){ setError(e?.response?.data?.detail || "Load failed"); }
    finally{ setLoading(false); }
  }

  useEffect(()=>{ load(); }, []);

  async function addNote(id:string){
    const token = localStorage.getItem("token"); if(!token){ router.push("/"); return; }
    const note = prompt("Type your note to send to Covenant:");
    if(!note || !note.trim()) return;
    await api.post(`/referrals/${id}/agent-note`, null, { params:{ note }, headers:{ Authorization:`Bearer ${token}` }});
    alert("Note sent.");
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="card lg:col-span-2">
          <h2 className="text-xl font-semibold mb-3">Referral Dashboard</h2>
          {loading ? (<p className="text-muted">Loading…</p>) : error ? (<p className="text-red-600">{error}</p>) : (
            <div className="overflow-auto">
              <table className="table">
                <thead>
                  <tr><th>Referral #</th><th>Company</th><th>Status</th><th>Notes</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map(r=> (
                    <tr key={r.id}>
                      <td>{r.ref_no || "—"}</td>
                      <td>{r.company}</td>
                      <td>{r.status}</td>
                      <td>{r.notes || "—"}</td>
                      <td>
                        <button className="btn btn-accent" onClick={()=>addNote(r.id)}>Add Note</button>
                      </td>
                    </tr>
                  ))}
                  {rows.length===0 && <tr><td colSpan={5} className="text-muted">No referrals yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <Link className="card text-center" href="/referral">1. Submit a Referral</Link>
          <a className="card text-center" href="/assets/program_overview.zip">2. Download Program Overview</a>
          <a className="card text-center" href="/assets/agent_sales_kit.zip">3. Agent Sales Kit</a>
        </div>
      </div>

      <section className="space-y-6">
        <h3 className="text-lg font-semibold text-center">Why This Partnership Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card"><div className="font-semibold">Trusted Relationship</div><p className="text-muted mt-2">Over 6 years working together to support Azor customers.</p></div>
          <div className="card"><div className="font-semibold">Comprehensive Services</div><p className="text-muted mt-2">MSP, Hosted Voice, Network/Wi‑Fi, and Cabling — one partner, one solution.</p></div>
          <div className="card"><div className="font-semibold">Fast Response</div><p className="text-muted mt-2">Covenant engages within 24 hours of every referral.</p></div>
          <div className="card"><div className="font-semibold">Scalable Delivery</div><p className="text-muted mt-2">Dedicated staff, proven partner network, and growth plan ensure customers are always supported.</p></div>
        </div>
      </section>
    </div>
  );
}
