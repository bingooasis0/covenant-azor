// frontend/src/app/page.tsx
"use client";
import { useState } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

export default function Login(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [err,setErr]=useState("");
  const router=useRouter();

  async function submit(e:React.FormEvent){
    e.preventDefault(); setErr("");
    try{
      const body=new URLSearchParams();
      body.append("username",email); body.append("password",password);
      const { data } = await api.post("/auth/token", body, { headers:{"Content-Type":"application/x-www-form-urlencoded"} });
      localStorage.setItem("token", data.access_token); localStorage.setItem("role", data.role);
      document.cookie=`token=${data.access_token}; path=/`; document.cookie=`role=${data.role}; path=/`;
      router.replace("/dashboard");
    }catch{ setErr("Invalid login"); }
  }

  return (
    <div style={{minHeight:"100vh", display:"grid", placeItems:"center"}}>
      <div className="card" style={{
        width:"min(440px, 92vw)", padding:24,
        background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(247,246,244,1) 60%)"
      }}>
        <div style={{textAlign:"center", marginBottom:12}}>
          <img src="/images/azor-logo.png" alt="Azor" style={{height:34, verticalAlign:"middle"}} />
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input className="input w-full" type="email" placeholder="Email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <input className="input w-full" type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          <div className="flex items-center gap-2">
            <button className="btn" style={{flex:1, height:42, fontWeight:600}}>Login</button>
            <a className="btn secondary" style={{height:42, display:"inline-flex", alignItems:"center"}} href="/support">Reset password</a>
          </div>
          {err && <div className="text-red-600 text-sm">{err}</div>}
        </form>
      </div>
    </div>
  );
}
