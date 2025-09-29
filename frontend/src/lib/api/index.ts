// frontend/src/lib/api/index.ts (diagnostic-instrumented)
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

let __api_base_logged = false;
function logOnceBase() {
  if (!__api_base_logged && typeof window !== "undefined") {
    __api_base_logged = true;
    // eslint-disable-next-line no-console
    console.debug("[API] API_BASE =", API_BASE);
  }
}

/** Core fetch: attaches Authorization; never clears token or redirects on 401.
 * Adds detailed diagnostics on non-OK responses and sets err.status.
 */
export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  logOnceBase();
  const headers = new Headers(init.headers || {});
  try {
    const tok =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    if (tok && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${tok}`);
    }
  } catch {}
  const url = `${API_BASE}${path}`;
  const resp = await fetch(url, { credentials: "include", ...init, headers });
  if (!resp.ok) {
    let bodyText = "";
    try { bodyText = await resp.text(); } catch {}
    const err: any = new Error(
      `[apiFetch] ${resp.status} ${resp.statusText} for ${path} :: ${bodyText.slice(0, 500)}`
    );
    err.status = resp.status;
    err.url = url;
    err.method = init?.method || "GET";
    err.body = init?.body;
    // eslint-disable-next-line no-console
    console.warn(err.message);
    throw err;
  }
  return resp;
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
  return r.json();
}
export async function changePassword(old_password: string, new_password: string) {
  const r = await apiFetch("/users/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password, new_password }),
  });
  return r.json();
}
export async function mfaReset() {
  const r = await apiFetch("/users/mfa/reset", { method: "POST" });
  return r.json();
}

/* ---------- Agent ---------- */
export async function fetchMyReferrals(): Promise<Referral[]> {
  try {
    const r = await apiFetch("/referrals/my");
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 404) return [];
    throw err;
  }
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
  return r.json();
}

/* ---------- Admin: users ---------- */
export async function adminListUsers(): Promise<User[]> {
  const r = await apiFetch("/admin/users");
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
  return r.json();
}
export async function adminDeleteUser(id: string) {
  await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
  return true;
}
export async function adminResetUserPassword(id: string, new_password: string) {
  const r = await apiFetch(`/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_password }),
  });
  return r.json();
}
export async function adminResetUserMfa(id: string) {
  const r = await apiFetch(`/admin/users/${id}/mfa/reset`, { method: "POST" });
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
  return r.json();
}

/* ---------- Admin: referrals ---------- */
export async function adminListReferrals(): Promise<Referral[]> {
  try {
    const r = await apiFetch("/admin/referrals");
    const d = await r.json();
    return Array.isArray(d) ? d : [];
  } catch (err: any) {
    if (err?.status === 401 || err?.status === 404) return [];
    throw err;
  }
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
  return r.json();
}
export async function adminDeleteReferral(id: string) {
  await apiFetch(`/admin/referrals/${id}`, { method: "DELETE" });
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
  const data = await r.json();
  return Array.isArray(data?.files) ? data.files : Array.isArray(data) ? data : [];
}
export async function uploadReferralFiles(id: string, files: File[]) {
  const fd = new FormData();
  for (const f of files) fd.append("files", f, f.name);
  const r = await apiFetch(`/referrals/${id}/files`, { method: "POST", body: fd });
  return r.json();
}
export async function deleteReferralFile(id: string, file_id: string) {
  await apiFetch(`/referrals/${id}/files/${file_id}`, { method: "DELETE" });
  return true;
}

/* ---------- Announcements ---------- */
export async function getAnnouncements(): Promise<{ items: string[] }> {
  try {
    const r = await apiFetch("/admin/announcements");
    return r.json();
  } catch (err: any) {
    if (err?.status === 404) return { items: [] };
    throw err;
  }
}
export async function updateAnnouncements(doc: { items: string[] }) {
  try {
    const r = await apiFetch("/admin/announcements", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(doc),
    });
    return r.json();
  } catch (err: any) {
    if (err?.status === 404) {
      try { localStorage.setItem("announcements", JSON.stringify(doc.items || [])); } catch {}
      return { saved: "local" };
    }
    throw err;
  }
}

/* ---------- Audit ---------- */
export async function fetchActivity(limit = 10, offset = 0) {
  const r = await apiFetch(
    `/audit/events?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(
      offset
    )}`
  );
  return r.json();
}
export async function fetchAuditPage(limit = 50, offset = 0) {
  return fetchActivity(limit, offset);
}
