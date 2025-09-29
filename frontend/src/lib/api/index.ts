// frontend/src/lib/api/index.ts
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

/** Core fetch: attaches Authorization; never clears token or redirects on 401 */
export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  try {
    const tok =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (tok && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${tok}`);
    }
  } catch {}
  return fetch(`${API_BASE}${path}`, { credentials: "include", ...init, headers });
}

/* ---------- Types ---------- */
export type Referral = {
  id: string;
  ref_no: string;
  company: string;
  status: string;
  created_at?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string | null;
  agent_id?: string;
};
export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "AZOR" | "COVENANT";
};

/* ---------- Auth ---------- */
export async function login(email: string, password: string, mfa_code?: string) {
  const body = new URLSearchParams();
  body.set("username", email);
  body.set("password", password);
  if (mfa_code) body.set("mfa_code", mfa_code);
  const r = await apiFetch("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  try {
    if (typeof window !== "undefined") {
      if (data?.access_token) window.localStorage.setItem("token", data.access_token);
      if (data?.role) window.localStorage.setItem("role", data.role);
    }
  } catch {}
  return data;
}

/* ---------- Account ---------- */
export async function fetchMe(): Promise<User> {
  const r = await apiFetch("/users/me");
  if (r.status === 401) throw new Error("Unauthorized");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function changePassword(old_password: string, new_password: string) {
  const r = await apiFetch("/users/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password, new_password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function mfaReset() {
  const r = await apiFetch("/users/mfa/reset", { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- Agent ---------- */
export async function fetchMyReferrals(): Promise<Referral[]> {
  const r = await apiFetch("/referrals/my");
  if (r.status === 401 || r.status === 404) return [];
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
export async function patchReferralAgent(
  id: string,
  body: Partial<
    Pick<
      Referral,
      "company" | "contact_name" | "contact_email" | "contact_phone" | "notes"
    >
  >
) {
  const r = await apiFetch(`/referrals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export type CreateReferralPayload = {
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  notes?: string;
  locations?: string[];
  reason?: string;
  opportunity_types?: string[];
  environment?: {
    users?: number;
    phone_provider?: string;
    internet_provider?: string;
    internet_bandwidth_mbps?: number;
    it_model?: string;
    [k: string]: any;
  };
  rep_name?: string;
  rep_email?: string;
  referral_date?: string;
};
export async function createReferral(payload: CreateReferralPayload) {
  const r = await apiFetch("/referrals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- Admin: users ---------- */
export async function adminListUsers(): Promise<User[]> {
  const r = await apiFetch("/admin/users");
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminCreateUser(body: {
  email: string;
  first_name: string;
  last_name: string;
  role: "AZOR" | "COVENANT";
  password: string;
}) {
  const r = await apiFetch("/admin/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminDeleteUser(id: string) {
  const r = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
  return true;
}
export async function adminResetUserPassword(id: string, new_password: string) {
  const r = await apiFetch(`/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password }),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminResetUserMfa(id: string) {
  const r = await apiFetch(`/admin/users/${id}/mfa/reset`, { method: "POST" });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminUpdateUser(
  id: string,
  body: Partial<Pick<User, "first_name" | "last_name" | "role">>
) {
  const r = await apiFetch(`/admin/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- Admin: referrals ---------- */
export async function adminListReferrals(): Promise<Referral[]> {
  const r = await apiFetch("/admin/referrals");
  if (r.status === 401 || r.status === 404) return [];
  if (!r.ok) throw new Error(await r.text());
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
export async function adminUpdateReferral(
  id: string,
  body: Partial<Referral> & { status?: string }
) {
  const r = await apiFetch(`/admin/referrals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function adminDeleteReferral(id: string) {
  const r = await apiFetch(`/admin/referrals/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(await r.text());
  return true;
}

/* ---------- Referral files ---------- */
export type ReferralFile = {
  file_id: string;
  name: string;
  size: number;
  content_type?: string;
  created_at?: string;
  preview?: string;
};
export async function getReferralFiles(id: string): Promise<ReferralFile[]> {
  const r = await apiFetch(`/referrals/${id}/files`);
  if (r.status === 404) return [];
  if (!r.ok) throw new Error(await r.text());
  const data = await r.json();
  return Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : [];
}
export async function uploadReferralFiles(id: string, files: File[]) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f, f.name);
  const r = await apiFetch(`/referrals/${id}/files`, { method: "POST", body: fd });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function deleteReferralFile(id: string, file_id: string) {
  const r = await apiFetch(`/referrals/${id}/files/${file_id}`, { method: "DELETE" });
  if (r.status === 404) return false;
  if (!r.ok) throw new Error(await r.text());
  return true;
}

/* ---------- Announcements ---------- */
export async function getAnnouncements(): Promise<{ items: string[] }> {
  const r = await apiFetch("/admin/announcements");
  if (r.status === 404) return { items: [] };
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function updateAnnouncements(doc: { items: string[] }) {
  const r = await apiFetch("/admin/announcements", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(doc),
  });
  if (r.status === 404) {
    try {
      localStorage.setItem("announcements", JSON.stringify(doc.items || []));
    } catch {}
    return { saved: "local" };
  }
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

/* ---------- Audit ---------- */
export async function fetchActivity(limit = 10, offset = 0) {
  const r = await apiFetch(
    `/audit/events?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(
      offset
    )}`
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
export async function fetchAuditPage(limit = 50, offset = 0) {
  return fetchActivity(limit, offset);
}
