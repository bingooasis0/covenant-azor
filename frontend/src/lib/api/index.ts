// frontend/src/lib/api/index.ts
import axios from "axios";

/* ---------- auth token ---------- */
function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
export function getAccessToken(): string | null {
  const c = readCookie("token");
  if (c && c.length > 10) return c;
  if (typeof window !== "undefined") {
    const ls = window.localStorage.getItem("token");
    if (ls && ls.length > 10) return ls;
  }
  return null;
}

/* ---------- axios ---------- */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000",
  withCredentials: false,
});
api.interceptors.request.use((config) => {
  const t = getAccessToken();
  if (t) (config.headers as Record<string, string>)["Authorization"] = `Bearer ${t}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    if (typeof window !== "undefined" && status === 401) {
      try { window.localStorage.removeItem("token"); document.cookie = "token=; Max-Age=0; Path=/"; } catch {}
      if (window.location.pathname !== "/") window.location.href = "/?reason=expired";
    }
    return Promise.reject(err);
  }
);

/* ---------- common ---------- */
export async function fetchMe(): Promise<any> {
  const { data } = await api.get("/users/me", { headers: { "Cache-Control": "no-store" } });
  return data;
}
export async function fetchMyReferrals(): Promise<any[]> {
  const { data } = await api.get("/referrals/my");
  return Array.isArray(data) ? data : [];
}
export async function fetchActivity(limit: number = 10): Promise<any[]> {
  try {
    const { data } = await api.get(`/audit/events`, { params: { limit } });
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
export async function patchReferralAgent(id: string, payload: Record<string, any>): Promise<any> {
  const { data } = await api.patch(`/referrals/${id}`, payload);
  return data;
}
export async function createReferral(payload: Record<string, any>): Promise<any> {
  const { data } = await api.post("/referrals", payload);
  return data;
}
export async function changePassword(payload: { old_password: string; new_password: string }): Promise<any> {
  const { data } = await api.post("/users/change-password", payload);
  return data;
}
export async function mfaSetup(): Promise<{ qr: string; recovery_codes: string[]; otpauth_url: string }> {
  const { data } = await api.post("/users/mfa/setup", {});
  return data;
}
export async function mfaVerify(payload: { code: string }): Promise<any> {
  const { data } = await api.post("/users/mfa/verify", payload);
  return data;
}
export async function mfaReset(): Promise<any> {
  const { data } = await api.post("/users/mfa/reset", {});
  return data;
}
export const resetMfa = mfaReset;

/* ---------- admin ---------- */
export type UserT = { id: string; email?: string; first_name?: string; last_name?: string; role?: string; name?: string };
export type RefT = {
  id: string; ref_no?: string; company?: string; status?: string; created_at?: string;
  contact_name?: string; contact_email?: string; contact_phone?: string; notes?: string;
};

export async function adminListUsers(): Promise<UserT[]> {
  const { data } = await api.get("/admin/users");
  return Array.isArray(data) ? data : [];
}
export async function adminCreateUser(payload: any): Promise<any> {
  const { data } = await api.post("/admin/users", payload);
  return data;
}
export async function adminDeleteUser(id: string): Promise<any> {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
}
export async function adminResetUserPassword(id: string, new_password: string): Promise<any> {
  const { data } = await api.post(`/admin/users/${id}/reset-password`, { new_password });
  return data;
}
export async function adminResetUserMfa(id: string): Promise<any> {
  const { data } = await api.post(`/admin/users/${id}/mfa/reset`, {});
  return data;
}
export async function adminListReferrals(): Promise<RefT[]> {
  const { data } = await api.get("/admin/referrals");
  return Array.isArray(data) ? data : [];
}
export async function adminUpdateReferral(id: string, payload: any): Promise<any> {
  const { data } = await api.patch(`/admin/referrals/${id}`, payload);
  return data;
}
export async function adminDeleteReferral(id: string): Promise<any> {
  try {
    const { data } = await api.delete(`/admin/referrals/${id}`);
    return data;
  } catch (e: any) {
    if (e?.response?.status === 405) {
      const { data } = await api.post(`/admin/referrals/${id}/delete`, {});
      return data;
    }
    throw e;
  }
}

/* ---------- audit ---------- */
export async function fetchAuditPage(limit: number = 50, offset: number = 0): Promise<any[]> {
  const { data } = await api.get(`/audit/events`, { params: { limit, offset } });
  return Array.isArray(data) ? data : [];
}

export default api;
