
"use client";
import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "./Toast";
export default function EmailModal({ open, onClose }:{open:boolean; onClose:()=>void}){
  const [message,setMessage]=useState(""); const { push } = useToast();
  if(!open) return null;
  async function send(){
    const token = localStorage.getItem("token"); if(!token) return;
    try{ await api.post("/support/contact", { message }, { headers:{ Authorization:`Bearer ${token}` }}); push({type:"success", text:"Email sent"}); setMessage(""); onClose(); }
    catch{ push({type:"error", text:"Failed to send"}); }
  }
  return (<div className="dialog-backdrop" onClick={onClose}><div className="dialog" onClick={(e)=>e.stopPropagation()}>
    <h3 className="text-lg font-semibold mb-3">Message Covenant</h3>
    <textarea className="w-full border rounded p-2 min-h-[120px]" placeholder="Type your message..." value={message} onChange={e=>setMessage(e.target.value)} />
    <div className="mt-3 flex justify-end gap-2"><button className="btn" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={send}>Send</button></div>
  </div></div>);
}
