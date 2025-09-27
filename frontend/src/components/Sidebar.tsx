
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconHome, IconClipboardList, IconFolder, IconUser, IconShield, IconLogout } from "@/lib/icons";
import { useEffect, useState } from "react";

const Item = ({href, label, active, Icon}:{href:string;label:string;active:boolean;Icon: any}) => (
  <Link href={href} className={`flex items-center gap-3 ${active?'active':''}`}>
    <Icon className="icon" aria-hidden /> <span>{label}</span>
  </Link>
);

export default function Sidebar(){
  const p = usePathname(); const router = useRouter();
  const [role,setRole]=useState(""); useEffect(()=>{ setRole(localStorage.getItem("role")||""); },[]);
  const logout=()=>{ try{ localStorage.clear(); document.cookie="token=; Max-Age=0; path=/"; document.cookie="role=; Max-Age=0; path=/"; }catch{} router.replace("/"); };

  return (
    <aside className="sidebar">
      <div className="brand nav-brand-block">
  <div className="nav-powered-by">powered by</div>
  <div className="nav-logos">
    <img src="/images/covenant-logo.png" alt="Covenant" className="nav-logo" style={{height:45}} /><div className="mid-star">✦</div>
    <img src="/images/azor-logo.png" alt="Azor" className="nav-logo" style={{height:45}} />
  </div>
</div>
      <nav className="nav mt-4 flex-1">
        <Item href="/dashboard" label="Dashboard" active={p.startsWith("/dashboard")} Icon={IconHome} />
        <Item href="/referral"  label="Referral"  active={p.startsWith("/referral")} Icon={IconClipboardList} />
        <Item href="/resources" label="Resources" active={p.startsWith("/resources")} Icon={IconFolder} />
        <Item href="/account"   label="Account"   active={p.startsWith("/account")} Icon={IconUser} />
        {role==="COVENANT" && <Item href="/admin" label="Admin" active={p.startsWith("/admin")} Icon={IconShield} />}
      </nav>
      <button className="btn secondary mt-2 w-full justify-center" onClick={logout}><IconLogout className="icon" /> Logout</button>
    </aside>
  );
}
