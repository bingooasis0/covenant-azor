
"use client";
import { useEffect, useState } from "react";
import { api, authHeader } from "../../../lib/api";
import { useToast } from "../../../components/Toast";
type User = { id:string; email:string; first_name:string; last_name:string; role:"AZOR"|"COVENANT" };
export default function Users(){
  const [list,setList]=useState<User[]>([]);
  const [form,setForm]=useState({email:"",first_name:"",last_name:"",password:"",role:"AZOR"} as any);
  const toast = useToast();
  async function load(){ try{ const res = await api.get("/admin/users", { headers: authHeader() }); setList(res.data); }catch(e:any){ toast.push({type:"error", text: e?.response?.status===401 ? "Unauthorized" : "Load failed"}); } }
  useEffect(()=>{ load(); },[]);
  async function create(){ try{ await api.post("/admin/users", form, { headers: authHeader() }); setForm({email:"",first_name:"",last_name:"",password:"",role:"AZOR"}); toast.push({type:"success", text:"User created"}); await load(); }catch{ toast.push({type:"error", text:"Create failed"});} }
  async function del(id:string){ try{ await api.delete(`/admin/users/${id}`, { headers: authHeader() }); toast.push({type:"success", text:"Deleted"}); await load(); }catch{ toast.push({type:"error", text:"Delete failed"});} }
  return (<div className="space-y-6">
    <h2 className="text-xl font-semibold">Users</h2>
    <div className="card space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <input className="border p-2 rounded" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="First" value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Last" value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/>
        <input className="border p-2 rounded" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <select className="border p-2 rounded" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
          <option value="AZOR">AZOR</option><option value="COVENANT">COVENANT</option>
        </select>
      </div><button className="btn btn-primary" onClick={create}>Create</button></div>
    <div className="card"><table className="table"><thead><tr><th>Email</th><th>Name</th><th>Role</th><th></th></tr></thead><tbody>
      {list.map(u=>(<tr key={u.id}><td>{u.email}</td><td>{u.first_name} {u.last_name}</td><td>{u.role}</td><td><button className="btn" onClick={()=>del(u.id)}>Delete</button></td></tr>))}
    </tbody></table></div></div>);
}
