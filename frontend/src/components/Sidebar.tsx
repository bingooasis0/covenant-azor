
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Item = ({href, label, active}:{href:string;label:string;active:boolean}) => (
  <Link href={href} className={`flex items-center gap-3 ${active?'active':''}`}>
    <span className="inline-block w-4" aria-hidden>•</span><span>{label}</span>
  </Link>
);

export default function Sidebar(){
  const p = usePathname(); const router = useRouter();
  const [role,setRole]=useState(""); useEffect(()=>{ setRole(localStorage.getItem("role")||""); },[]);
  const logout=()=>{ try{ localStorage.clear(); document.cookie="token=; Max-Age=0; path=/"; document.cookie="role=; Max-Age=0; path=/"; }catch{} router.replace("/"); };

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/images/covenant-logo.png" alt="Covenant" className="logo-img" />
        <span className="opacity-60">+</span>
        <img src="/images/azor-logo.png" alt="Azor" className="logo-img" />
      </div>
      <nav className="nav mt-4 flex-1">
        <Item href="/dashboard" label="Dashboard" active={p.startsWith("/dashboard")} />
        <Item href="/referral"  label="Referral"  active={p.startsWith("/referral")} />
        <Item href="/resources" label="Resources" active={p.startsWith("/resources")} />
        <Item href="/account"   label="Account"   active={p.startsWith("/account")} />
        {role==="COVENANT" && <Item href="/admin" label="Admin" active={p.startsWith("/admin")} />}
      </nav>
      <button className="btn secondary mt-2" onClick={logout}>Logout</button>
    </aside>
  );
}
