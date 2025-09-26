
import axios from "axios";
export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000" });
export function authHeader(){ const t=localStorage.getItem("token"); return t?{Authorization:`Bearer ${t}`}:{ }; }
