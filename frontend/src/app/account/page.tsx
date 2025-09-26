// frontend/src/app/account/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { fetchMe, changePassword, mfaReset } from "@/lib/api";

export default function AccountPage(){
  const [me, setMe] = useState<any>(null);
  const [oldp, setOld] = useState(""); const [newp, setNew] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(()=>{ (async()=>{ try{ setMe(await fetchMe()); }catch{} })(); },[]);
  return (
    <div className="wrap">
      <h1 style={{fontSize:"20px", fontWeight:600}}>Account</h1>
      <div className="card" style={{padding:16, marginTop:12}}>
        <div className="label">Email</div><div style={{fontWeight:600}}>{me?.email??"-"}</div>
        <div className="label" style={{marginTop:8}}>Role</div><div style={{fontWeight:600}}>{me?.role??"-"}</div>
      </div>
      <div className="card" style={{padding:16, marginTop:12}}>
        <h2 style={{fontSize:"16px", fontWeight:600, marginBottom:8}}>Security</h2>
        <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label className="label">Old password</label><input className="input" type="password" autoComplete="current-password" value={oldp} onChange={e=>setOld(e.target.value)} /></div>
          <div><label className="label">New password</label><input className="input" type="password" autoComplete="new-password" value={newp} onChange={e=>setNew(e.target.value)} /></div>
        </div>
        <div style={{display:"flex", gap:12, marginTop:12}}>
          <button className="btn primary" onClick={async()=>{ try{ await changePassword({old_password: oldp, new_password: newp}); setMsg("Password changed"); }catch{ setMsg("Error"); } }}>Change password</button>
          <button className="btn ghost" onClick={async()=>{ try{ await mfaReset(); setMsg("MFA reset requested"); }catch{ setMsg("Error"); } }}>Reset MFA</button>
        </div>
        {msg && <div className="label" style={{marginTop:8}}>{msg}</div>}
      </div>
    </div>
  );
}
