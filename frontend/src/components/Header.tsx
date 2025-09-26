
"use client";
import { useEffect, useState } from "react";
import { fetchMe } from "../lib/api";

export default function Header(){
  const [name,setName]=useState("User");
  const [role,setRole]=useState<"AZOR"|"COVENANT"|"">("");

  useEffect(()=>{
    const token = localStorage.getItem("token"); if(!token) return;
    fetchMe().then(me=>{
      const n = `${me.first_name} ${me.last_name}`.trim() || me.email;
      setName(n); setRole(me.role);
      document.cookie = `role=${me.role}; path=/`; document.cookie = `token=${token}; path=/`;
      localStorage.setItem("role", me.role);
    }).catch(()=>{});
  },[]);

  return (
    <header className="header w-full">
      <div className="w-full px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/covenant-logo.png" alt="Covenant" className="h-7 w-auto" />
          <span className="opacity-60">+</span>
          <img src="/images/azor-logo.png" alt="Azor" className="h-7 w-auto" />
        </div>
        <nav className="flex items-center gap-4">
          <a href="/dashboard" className="btn">Dashboard</a>
          <a href="/referral" className="btn">Referral</a>
          <a href="/resources" className="btn">Resources</a>
          <a href="/account" className="btn">Account</a>
          {role==="COVENANT" && <a href="http://localhost:3001/admin" className="btn">Admin</a>}
        </nav>
        <div className="text-sm opacity-80">Logged in as {name}</div>
      </div>
    </header>
  );
}
