
"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import UserMenu from "./UserMenu";
import { fetchMe } from "../lib/api";

export default function Header(){
  const [name,setName]=useState("User"); const [role,setRole]=useState<"AZOR"|"COVENANT"|"">("");
  const pathname = usePathname();
  useEffect(()=>{
    const token = localStorage.getItem("token"); if(!token) return;
    fetchMe(token).then(me=>{
      const n = `${me.first_name} ${me.last_name}`.trim() || me.email;
      setName(n); setRole(me.role);
      document.cookie=`role=${me.role}; path=/`; document.cookie=`token=${token}; path=/`;
      localStorage.setItem("role", me.role);
    }).catch(()=>{});
  },[]);
  if(pathname==="/") return null; // hide on login
  return (
    <div className="header-bar">
      <div className="wrapper w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">Powered by</span>
          <div className="flex items-center gap-2">
            <img src="/images/covenant-logo.png" alt="Covenant" className="h-7 w-auto" />
            <span className="opacity-70">+</span>
            <img src="/images/azor-logo.png" alt="Azor" className="h-7 w-auto" />
          </div>
        </div>
        <div className="text-sm font-medium">Admin Portal</div>
        <UserMenu name={name} role={role} />
      </div>
    </div>
  );
}
