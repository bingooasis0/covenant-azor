
import axios from "axios";
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000" });
function getCookie(name:string){ const m = typeof document!=='undefined' && document.cookie.match('(?:^|; )'+name+'=([^;]*)'); return m?decodeURIComponent(m[1]):null; }
api.interceptors.request.use(cfg=>{ const ls=typeof window!=='undefined' ? localStorage.getItem('token') : null; const ck=getCookie('token'); const tok=ls||ck; if(tok){ cfg.headers=cfg.headers??{}; cfg.headers.Authorization=`Bearer ${tok}`; } return cfg; });
export async function fetchMe(){ const r=await api.get('/users/me'); return r.data as {id:string; email:string; first_name:string; last_name:string; role:"AZOR"|"COVENANT"}; }
export async function fetchMyReferrals(){ const r=await api.get('/referrals/my'); return r.data as any[]; }
export async function fetchActivity(refId?:string){ try{ const r=await api.get('/audit/events?limit=50'); const items=r.data as any[]; return refId? items.filter(x=>x.entity_id===refId):items; }catch{return [];} }
export async function patchReferralAgent(refId:string, payload:any){ return api.patch(`/referrals/${refId}`, payload); }
export async function changePassword(oldPassword:string,newPassword:string){ return api.post('/users/change-password',{old_password:oldPassword,new_password:newPassword}); }
export async function resetMfa(){ return api.post('/users/mfa/reset',{}); }
