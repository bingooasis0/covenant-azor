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

// Response interceptor to handle 401 unauthorized
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear all tokens on 401
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        document.cookie = "azor_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

        // Only redirect if not already on login page
        if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

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
  created_at?: string;
  mfa_enabled?: boolean;
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
      // Set both cookies for compatibility with middleware and old code
      document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
      document.cookie = `azor_access=${data.access_token}; path=/; SameSite=Lax`;
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

export type User = Me;

export type Referral = {
  id: string;
  ref_no: string;
  company: string;
  status: string;
  created_at?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  agent_id?: string;
  opportunity_types?: string[] | any;
  locations?: string[] | any;
  environment?: any;
  reason?: string;
};

export async function fetchMe() {
  const { data } = await http.get("/users/me");
  return data as Me;
}

export async function changePassword(old_password: string, new_password: string) {
  const { data } = await http.post("/users/change-password", { old_password, new_password });
  return data;
}

export async function mfaReset() {
  const { data } = await http.post("/users/mfa/reset", {});
  return data;
}

// Audit
export async function fetchAuditPage(offset: number, limit: number) {
  const { data } = await http.get(`/audit/events?limit=${limit}&offset=${offset}`);
  return data;
}

// Announcements
export async function getAnnouncements() {
  const { data } = await http.get("/admin/announcements");
  return data;
}

export async function updateAnnouncements(payload: any) {
  const { data } = await http.put("/admin/announcements", payload);
  return data;
}

// Admin - Users
export async function adminListUsers() {
  const { data } = await http.get("/admin/users");
  return data;
}

export async function adminCreateUser(payload: any) {
  const { data } = await http.post("/admin/users", payload);
  return data;
}

export async function adminUpdateUser(id: string, payload: any) {
  const { data } = await http.patch(`/admin/users/${id}`, payload);
  return data;
}

export async function adminDeleteUser(id: string) {
  const { data } = await http.delete(`/admin/users/${id}`);
  return data;
}

export async function adminResetUserPassword(id: string, new_password: string) {
  const { data } = await http.post(`/admin/users/${id}/reset-password`, { new_password });
  return data;
}

export async function adminResetUserMfa(id: string) {
  const { data } = await http.post(`/admin/users/${id}/mfa/reset`, {});
  return data;
}

// Admin - Referrals
export async function adminListReferrals() {
  const { data } = await http.get("/admin/referrals");
  return data;
}

export async function adminCreateReferral(payload: any) {
  const { data } = await http.post("/admin/referrals", payload);
  return data;
}

export async function adminUpdateReferral(id: string, payload: any) {
  const { data } = await http.patch(`/admin/referrals/${id}`, payload);
  return data;
}

export async function adminDeleteReferral(id: string) {
  const { data } = await http.delete(`/admin/referrals/${id}`);
  return data;
}

// User referrals
export async function listMyReferrals() {
  const { data } = await http.get("/referrals/my");
  return data;
}

export async function fetchMyReferrals() {
  return listMyReferrals();
}

export async function createReferral(payload: any) {
  const { data } = await http.post("/referrals", payload);
  return data;
}

export async function updateReferral(id: string, payload: any) {
  const { data } = await http.patch(`/referrals/${id}`, payload);
  return data;
}

export async function patchReferralAgent(id: string, payload: any) {
  return updateReferral(id, payload);
}

export async function listReferralFiles(id: string) {
  const { data } = await http.get(`/referrals/${id}/files`);
  return data;
}

export async function getReferralFiles(id: string) {
  return listReferralFiles(id);
}

export async function uploadReferralFile(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await http.post(`/referrals/${id}/files`, formData);
  return data;
}

export async function uploadReferralFiles(id: string, files: File[]) {
  const results = [];
  for (const file of files) {
    results.push(await uploadReferralFile(id, file));
  }
  return results;
}

export async function deleteReferralFile(refId: string, fileId: string) {
  const { data } = await http.delete(`/referrals/${refId}/files/${fileId}`);
  return data;
}

export const api = {
  core: { API_BASE },
  auth: { login },
  mfa: { setup: mfaSetup, verify: mfaVerify },
};

export default http;
