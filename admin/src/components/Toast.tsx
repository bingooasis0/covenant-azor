
"use client";
import { createContext, useContext, useState, ReactNode } from "react";
type Toast = { id:number; type:"success"|"error"; text:string };
const ToastCtx = createContext<{push:(t:Omit<Toast,"id">)=>void}>({push:()=>{}});
export function ToastProvider({ children }:{children:ReactNode}){
  const [items,setItems]=useState<Toast[]>([]);
  function push(t:Omit<Toast,"id">){ const id=Date.now(); setItems(s=>[...s,{id,...t}]); setTimeout(()=>setItems(s=>s.filter(x=>x.id!==id)), 4000); }
  return (<ToastCtx.Provider value={{push}}>{children}<div className="toast-wrap">{items.map(t=><div key={t.id} className={`toast ${t.type}`}>{t.text}</div>)}</div></ToastCtx.Provider>);
}
export function useToast(){ return useContext(ToastCtx); }
