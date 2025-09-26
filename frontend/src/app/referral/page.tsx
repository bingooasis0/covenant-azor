
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import Link from "next/link";
import { useToast } from "../../components/Toast";

export default function ReferralFormPage(){
  const router=useRouter(); const { push } = useToast();
  const [company,setCompany]=useState(""); const [contactName,setContactName]=useState("");
  const [contactEmail,setContactEmail]=useState(""); const [contactPhone,setContactPhone]=useState("");
  const [notes,setNotes]=useState(""); const [busy,setBusy]=useState(false);

  useEffect(()=>{ const t=localStorage.getItem("token"); if(!t) router.push("/"); },[router]);

  async function submit(e:React.FormEvent){ e.preventDefault();
    const token=localStorage.getItem("token"); if(!token){ router.push("/"); return; }
    try{
      setBusy(true);
      const payload={ company, contact_name:contactName, contact_email:contactEmail, contact_phone:contactPhone, notes: notes || null };
      const res=await api.post('/referrals', payload, { headers:{ Authorization:`Bearer ${token}` }});
      push({type:"success", text:`Referral submitted: ${res.data.ref_no}`});
      setCompany(''); setContactName(''); setContactEmail(''); setContactPhone(''); setNotes('');
    }catch(e:any){ push({type:"error", text: e?.response?.data?.detail || 'Submit failed' }); }
    finally{ setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Submit a Referral</h1>
        <Link href="/dashboard" className="btn">Back to Dashboard</Link>
      </div>
      <form onSubmit={submit} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input className="w-full border p-2 rounded" placeholder="Company Name" value={company} onChange={e=>setCompany(e.target.value)} required/>
          <input className="w-full border p-2 rounded" placeholder="Contact Name" value={contactName} onChange={e=>setContactName(e.target.value)} required/>
          <input className="w-full border p-2 rounded" type="email" placeholder="Contact Email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} required/>
          <input className="w-full border p-2 rounded" type="tel" placeholder="Contact Phone" value={contactPhone} onChange={e=>setContactPhone(e.target.value)} required/>
        </div>
        <textarea className="w-full border p-2 rounded min-h-[140px]" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)}/>
        <button className="btn btn-primary" disabled={busy} type="submit">{busy?"Submitting...":"Submit"}</button>
      </form>
    </div>
  );
}
