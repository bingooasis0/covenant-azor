
import axios from "axios";
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000" });
function getCookie(name:string){ const m=document.cookie.match('(?:^|; )'+name+'=([^;]*)'); return m?decodeURIComponent(m[1]):null; }
export function authHeader(){
  let t = localStorage.getItem("token"); if(!t){ t = getCookie("token") || undefined as any; if(t) localStorage.setItem("token", t); }
  return t ? { Authorization: `Bearer ${t}` } : {};
}
export async function fetchMe(token:string){
  const res = await api.get("/users/me", { headers:{ Authorization:`Bearer ${token}` }});
  return res.data as { id:string; email:string; first_name:string; last_name:string; role:"AZOR"|"COVENANT" };
}
export function setAuthToken(token:string){ api.defaults.headers.common["Authorization"] = `Bearer ${token}`; }
