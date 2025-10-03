// frontend/src/lib/api.ts
import axios, { AxiosInstance } from "axios";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
  return m ? decodeURIComponent(m[1]) : null;
}

http.interceptors.request.use((cfg) => {
  const url = (cfg.url || "").toString();
  if (url.includes("/auth/token") || url === "/token") return cfg;
  const ls = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const ck = getCookie("azor_access") || getCookie("token");
  const tok = ls || ck;
  if (tok) {
    if (!cfg.headers) cfg.headers = {} as any;
    (cfg.headers as any).Authorization = `Bearer ${tok}`;
  }
  return cfg;
});

export function errText(e: any): string {
  const d = e?.response?.data;
  if (typeof d === "string") return d;
  if (typeof d?.message === "string") return d.message;
  if (typeof d?.detail === "string") return d.detail;
  if (typeof d?.code === "string") return d.code;
  return e?.message || "Request failed";
}

export type Role = "AZOR" | "COVENANT";

export type Me = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
};

export async function login(username: string, password: string, mfaCode?: string) {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  if (mfaCode) form.set("mfa_code", mfaCode);

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (mfaCode) headers["X-MFA-Code"] = mfaCode;

  const { data } = await http.post("/auth/token", form, { headers, timeout: 15000 });
  if (data?.access_token) {
    try {
      localStorage.setItem("token", data.access_token);
      if (data?.role) localStorage.setItem("role", data.role);
      document.cookie = `token=${data.access_token}; path=/`;
    } catch {}
  }
  return data as { access_token?: string; token_type?: "bearer"; role?: Role; mfa_enroll?: boolean };
}

export async function mfaSetup() {
  const { data } = await http.post("/users/mfa/setup", {});
  return data as { otpauth: string; qr: string; secret?: string; recovery_codes: string[] };
}

export async function mfaVerify(code: string, recovery_code?: string) {
  const { data } = await http.post("/users/mfa/verify", recovery_code ? { recovery_code } : { code });
  return data as { ok: boolean };
}

export const api = {
  core: { API_BASE },
  auth: { login },
  mfa: { setup: mfaSetup, verify: mfaVerify },
};

export default http;
