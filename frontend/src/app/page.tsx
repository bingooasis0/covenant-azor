
"use client";
import { useState } from "react";
import { api, setAuthToken } from "../lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";

export default function LoginPage(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState("");
  const router = useRouter(); const { push } = useToast();
  async function handleSubmit(e:React.FormEvent){ e.preventDefault(); setError("");
    try{
      const body=new URLSearchParams(); body.append("username",email); body.append("password",password);
      const res=await api.post("/auth/token", body,{headers:{"Content-Type":"application/x-www-form-urlencoded"}});
      const token=res.data.access_token as string; const role=res.data.role as string;
      localStorage.setItem("token",token); localStorage.setItem("role",role);
      document.cookie=`role=${role}; path=/`; document.cookie=`token=${token}; path=/`;
      setAuthToken(token); push({type:"success", text:"Logged in"}); router.push("/dashboard");
    }catch{ setError("Invalid login"); }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <form onSubmit={handleSubmit} className="card max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Azor Partner Login</h1>
        <input className="w-full border p-2 rounded" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" required/>
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/>
        <button className="btn btn-primary w-full" type="submit">Login</button>
        {error && <p className="text-red-600">{error}</p>}
      </form>
    </div>
  );
}
