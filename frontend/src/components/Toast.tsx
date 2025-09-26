
"use client";
import { createContext, useContext, useState } from "react";
type Toast = { id:number; type:"success"|"error"|"info"; text:string };
const Ctx = createContext<{push:(t:Omit<Toast,"id">)=>void}>({push:()=>{}});
export function ToastProvider({ children }:{children:React.ReactNode}){
  const [items,setItems]=useState<Toast[]>([]);
  function push(t:Omit<Toast,"id">){ const id=Date.now(); setItems(s=>[...s,{id,...t}]); setTimeout(()=>setItems(s=>s.filter(x=>x.id!==id)), 3500); }
  return (<Ctx.Provider value={{push}}>
    {children}
    <div style={{position:"fixed",right:16,bottom:16,display:"flex",flexDirection:"column",gap:8,zIndex:9999}}>
      {items.map(t=><div key={t.id} style={{background:t.type==="error"?"#b91c1c":"#111827",color:"#fff",padding:"10px 12px",borderRadius:10,boxShadow:"0 8px 20px rgba(0,0,0,.2)"}}>{t.text}</div>)}
    </div>
  </Ctx.Provider>);
}
export const useToast=()=>useContext(Ctx);
