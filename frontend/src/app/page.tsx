
"use client";
import { useState } from "react";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";

export default function Login(){
  const [email,setEmail]=useState(""), [password,setPassword]=useState(""), [err,setErr]=useState("");
  const router=useRouter();
  async function submit(e:React.FormEvent){ e.preventDefault(); setErr("");
    try{
      const body=new URLSearchParams(); body.append("username",email); body.append("password",password);
      const { data } = await api.post("/auth/token", body, { headers:{"Content-Type":"application/x-www-form-urlencoded"} });
      localStorage.setItem("token", data.access_token); localStorage.setItem("role", data.role);
      document.cookie=`token=${data.access_token}; path=/`; document.cookie=`role=${data.role}; path=/`;
      router.replace("/dashboard");
    }catch{ setErr("Invalid login"); }
  }
  return (
    <form onSubmit={submit} className="card w-[380px]">
      <h1 className="text-lg font-semibold mb-3 text-center">Azor Partner Login</h1>
      <input className="input w-full mb-2" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
      <input className="input w-full mb-3" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required/>
      <button className="btn w-full">Login</button>
      {err && <div className="text-red-600 mt-2 text-sm">{err}</div>}
    </form>
  );
}
