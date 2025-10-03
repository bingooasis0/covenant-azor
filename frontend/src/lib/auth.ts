import http from "@/lib/http";

/** Form-encoded login; sets cookie via withCredentials */
export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password });
  const { data } = await http.post("/auth/token", body);
  return data as { mfa_enroll?: boolean; role?: string };
}
