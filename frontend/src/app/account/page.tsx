// frontend/src/app/account/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { fetchMe, changePassword, mfaReset } from "@/lib/api/index";
import { IconKey, IconShield, IconUser } from "@/lib/icons";

export default function AccountPage(){
  const [me, setMe] = useState<any>(null);
  const [oldp, setOld] = useState("");
  const [newp, setNew] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(()=>{ (async()=>{ try{ setMe(await fetchMe()); }catch{} })(); },[]);

  return (
    <div className="wrap">
      <h1 style={{fontSize:"20px", fontWeight:600}}>Account</h1>

      <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr", gap:12, alignItems:"start", marginTop:12}}>
        {/* Profile */}
        <div className="card" style={{padding:16}}>
          <div className="flex items-center gap-2 mb-2">
            <IconUser className="icon" />
            <h2 style={{fontSize:"16px", fontWeight:600}}>Profile</h2>
          </div>
          <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr", gap:12}}>
            <div>
              <div className="label">User ID</div>
              <div style={{fontWeight:600}}>{me?.id ?? "-"}</div>
            </div>
            <div>
              <div className="label">Role</div>
              <div style={{fontWeight:600}}>{me?.role ?? "-"}</div>
            </div>
            <div>
              <div className="label">Email</div>
              <div style={{fontWeight:600}}>{me?.email ?? "-"}</div>
            </div>
            <div>
              <div className="label">Name</div>
              <div style={{fontWeight:600}}>{me?.first_name ?? "-"} {me?.last_name ?? ""}</div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card" style={{padding:16}}>
          <div className="flex items-center gap-2 mb-2">
            <IconShield className="icon" />
            <h2 style={{fontSize:"16px", fontWeight:600}}>Security</h2>
          </div>
          <div className="grid" style={{gridTemplateColumns:"1fr", gap:12}}>
            <div>
              <label className="label">Old password</label>
              <input className="input w-full" type="password" autoComplete="current-password" value={oldp} onChange={e=>setOld(e.target.value)} />
            </div>
            <div>
              <label className="label">New password</label>
              <input className="input w-full" type="password" autoComplete="new-password" value={newp} onChange={e=>setNew(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button className="btn" onClick={async()=>{ try{ await changePassword({ old_password: oldp, new_password: newp }); setMsg("Password changed"); }catch{ setMsg("Error"); } }}>
              <IconKey className="icon" /> Change password
            </button>
            <button className="btn ghost" onClick={async()=>{ try{ await mfaReset(); setMsg("MFA reset requested"); }catch{ setMsg("Error"); } }}>
              <IconShield className="icon" /> Reset Multi‑Factor
            </button>
          </div>
          {msg && <div className="label" style={{marginTop:8}}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}
