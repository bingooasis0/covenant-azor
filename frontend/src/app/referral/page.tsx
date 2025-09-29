/* frontend/src/app/referral/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import {
  // Agent
  fetchMyReferrals,
  patchReferralAgent,
  // Admin
  adminListReferrals,
  adminUpdateReferral,
  getReferralFiles,
  uploadReferralFiles,
  deleteReferralFile,
  // Types
  type Referral,
} from "@/lib/api";

/* ------------------ cookie helpers ------------------ */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}
function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/`;
}

/* ------------------ error helpers ------------------ */
function isUnauthorized(err: any) {
  if (!err) return false;
  // Works with future wrapper err.status and current message-only errors.
  return err.status === 401 || /\b401\b/.test(String(err?.message || ""));
}

type RefFile = { file_id: string; name: string; size: number; content_type?: string; created_at?: string };

export default function ReferralPage() {
  /* ------------------ role ------------------ */
  const [role, setRole] = useState<"AZOR" | "COVENANT">("AZOR");
  useEffect(() => {
    try {
      const r = window.localStorage.getItem("role");
      if (r === "COVENANT" || r === "AZOR") setRole(r);
    } catch {
      /* noop */
    }
  }, []);

  /* ------------------ banners ------------------ */
  const [authError, setAuthError] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  /* ------------------ data ------------------ */
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  /* ------------------ pagination (client-side) ------------------ */
  const initialPageSize = (() => {
    const v = parseInt(getCookie("ref_page_size") || "25", 10);
    return Number.isFinite(v) && v > 0 ? v : 25;
  })();
  const [limit, setLimit] = useState<number>(initialPageSize);
  const [page, setPage] = useState<number>(0);

  useEffect(() => setCookie("ref_page_size", String(limit)), [limit]);

  const total = rows.length;
  const start = page * limit;
  const end = Math.min(start + limit, total);
  const pageRows = useMemo(() => rows.slice(start, end), [rows, start, end]);
  const canPrev = page > 0;
  const canNext = end < total;

  useEffect(() => {
    // reset page if size changes
    setPage(0);
  }, [limit]);

  /* ------------------ edit modal ------------------ */
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [ef, setEf] = useState<any>({});
  const selRef = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);

  /* files (admin only) */
  const [files, setFiles] = useState<RefFile[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const isAdmin = role === "COVENANT";

  /* ------------------ load ------------------ */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setAuthError(false);
      setPageError(null);
      try {
        const data = isAdmin ? await adminListReferrals() : await fetchMyReferrals();
        if (cancelled) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (cancelled) return;
        if (isUnauthorized(e)) setAuthError(true);
        else setPageError(e?.message || "Failed to load referrals.");
        setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  /* ------------------ actions ------------------ */
  function openEdit(r: Referral) {
    setSelectedId(r.id);
    setEf({
      company: r.company || "",
      status: r.status || "New",
      contact_name: r.contact_name || "",
      contact_email: r.contact_email || "",
      contact_phone: r.contact_phone || "",
      notes: r.notes || "",
      locationsCsv: "",
      env_users: "",
      env_phone_provider: "",
      env_isp: "",
      env_bandwidth: "",
      env_it_model: "",
    });
    if (isAdmin) {
      (async () => {
        try {
          const list = (await getReferralFiles(r.id)) as any;
          setFiles(Array.isArray(list) ? list : (list?.files || []));
        } catch {
          setFiles([]);
        }
      })();
    } else {
      setFiles([]);
    }
    setNewFiles([]);
    setEditOpen(true);
  }

  async function save() {
    if (!selRef) return;
    setPageError(null);
    try {
      if (isAdmin) {
        const body: any = {
          company: ef.company,
          status: ef.status,
          contact_name: ef.contact_name,
          contact_email: ef.contact_email,
          contact_phone: ef.contact_phone,
          notes: ef.notes || null,
        };
        if (ef.locationsCsv?.trim()) {
          body.locations = ef.locationsCsv
            .split(",")
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
        body.environment = {
          users: ef.env_users ? Number(ef.env_users) : undefined,
          phone_provider: ef.env_phone_provider || undefined,
          internet_provider: ef.env_isp || undefined,
          internet_bandwidth_mbps: ef.env_bandwidth ? Number(ef.env_bandwidth) : undefined,
          it_model: ef.env_it_model || undefined,
        };
        const updated = await adminUpdateReferral(selRef.id, body);
        setRows((prev) => prev.map((r) => (r.id === selRef.id ? { ...r, ...updated } : r)));

        if (newFiles.length > 0) {
          await uploadReferralFiles(selRef.id, newFiles);
          const list = (await getReferralFiles(selRef.id)) as any;
          setFiles(Array.isArray(list) ? list : (list?.files || []));
          setNewFiles([]);
        }
      } else {
        await patchReferralAgent(selRef.id, {
          company: ef.company,
          contact_name: ef.contact_name,
          contact_email: ef.contact_email,
          contact_phone: ef.contact_phone,
          notes: ef.notes,
        });
        setRows((prev) =>
          prev.map((r) =>
            r.id === selRef.id
              ? {
                  ...r,
                  company: ef.company,
                  contact_name: ef.contact_name,
                  contact_email: ef.contact_email,
                  contact_phone: ef.contact_phone,
                  notes: ef.notes,
                }
              : r
          )
        );
      }
      setEditOpen(false);
    } catch (e: any) {
      if (isUnauthorized(e)) setAuthError(true);
      else setPageError(e?.message || "Save failed");
    }
  }

  async function removeFile(fid: string) {
    if (!selRef) return;
    try {
      await deleteReferralFile(selRef.id, fid);
      setFiles((prev) => prev.filter((f) => f.file_id !== fid));
    } catch (e: any) {
      setPageError(e?.message || "Remove failed");
    }
  }

  /* ------------------ render ------------------ */
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{isAdmin ? "All Referrals" : "My Referrals"}</h1>
        <a href="/create-referral" className="btn">
          Create Referral
        </a>
      </div>

      {/* banners */}
      {authError && (
        <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2">
          Session expired or unauthorized. Please{" "}
          <a className="link" href="/" aria-label="Sign in">
            sign in again
          </a>
          .
        </div>
      )}
      {pageError && !authError && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{pageError}</div>
      )}

      {/* table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left border-b">Ref #</th>
                <th className="px-3 py-2 text-left border-b">Company</th>
                <th className="px-3 py-2 text-left border-b">Status</th>
                <th className="px-3 py-2 text-left border-b">Contact</th>
                <th className="px-3 py-2 text-left border-b">Email</th>
                <th className="px-3 py-2 text-left border-b">Phone</th>
                <th className="px-3 py-2 text-left border-b">Created</th>
                <th className="px-3 py-2 text-right border-b w-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                    No referrals found.
                  </td>
                </tr>
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id} className="border-b">
                    <td className="px-3 py-2">{r.ref_no}</td>
                    <td className="px-3 py-2">{r.company}</td>
                    <td className="px-3 py-2">
                      <Badge status={r.status || "New"} />
                    </td>
                    <td className="px-3 py-2">{r.contact_name || "-"}</td>
                    <td className="px-3 py-2">{r.contact_email || "-"}</td>
                    <td className="px-3 py-2">{r.contact_phone || "-"}</td>
                    <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex gap-2 justify-end">
                        <button className="btn ghost" onClick={() => openEdit(r)}>
                          Edit
                        </button>
                        <a className="btn ghost" href={`/referral`}>
                          View
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* pagination controls */}
        <div className="flex items-center gap-3 mt-3">
          <label className="text-sm">Page size</label>
          <select
            className="input"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 25)}
            aria-label="Referrals page size"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <div className="ml-auto flex gap-2">
            <button className="btn ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={!canPrev}>
              Prev
            </button>
            <div className="text-sm px-2 py-1 border rounded">
              {total === 0 ? "0–0 of 0" : `${start + 1}–${end} of ${total}`}
            </div>
            <button className="btn ghost" onClick={() => setPage((p) => p + 1)} disabled={!canNext}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* edit modal */}
      {editOpen && selRef && (
        <div className="modal-backdrop" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Edit {selRef.ref_no}</div>
              <button className="btn ghost" onClick={() => setEditOpen(false)}>
                Close
              </button>
            </header>
            <section className="space-y-3">
              {pageError && !authError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{pageError}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    className="input w-full"
                    value={ef.company}
                    onChange={(e) => setEf((p: any) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input w-full"
                    value={ef.status}
                    onChange={(e) => setEf((p: any) => ({ ...p, status: e.target.value }))}
                    disabled={!isAdmin}
                  >
                    {["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost", "On Hold", "Commission Paid"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    className="input w-full"
                    value={ef.contact_name}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    value={ef.contact_email}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text sm font-medium mb-1">Contact Phone</label>
                  <input
                    className="input w-full"
                    value={ef.contact_phone}
                    onChange={(e) => setEf((p: any) => ({ ...p, contact_phone: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Locations (CSV)</label>
                  <input
                    className="input w-full"
                    value={ef.locationsCsv}
                    onChange={(e) => setEf((p: any) => ({ ...p, locationsCsv: e.target.value }))}
                    placeholder="NYC, Boston, ..."
                    disabled={!isAdmin}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    className="input w-full min-h-[120px]"
                    value={ef.notes}
                    onChange={(e) => setEf((p: any) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              {isAdmin && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Users</label>
                      <input
                        className="input w-full"
                        type="number"
                        inputMode="numeric"
                        value={ef.env_users}
                        onChange={(e) => setEf((p: any) => ({ ...p, env_users: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone provider</label>
                      <input
                        className="input w-full"
                        value={ef.env_phone_provider}
                        onChange={(e) => setEf((p: any) => ({ ...p, env_phone_provider: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Internet provider</label>
                      <input
                        className="input w-full"
                        value={ef.env_isp}
                        onChange={(e) => setEf((p: any) => ({ ...p, env_isp: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bandwidth (Mbps)</label>
                      <input
                        className="input w-full"
                        type="number"
                        inputMode="decimal"
                        value={ef.env_bandwidth}
                        onChange={(e) => setEf((p: any) => ({ ...p, env_bandwidth: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">IT support model</label>
                      <input
                        className="input w-full"
                        value={ef.env_it_model}
                        onChange={(e) => setEf((p: any) => ({ ...p, env_it_model: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="font-semibold">Files</div>
                  {files.length === 0 ? (
                    <div className="text-sm text-[var(--muted)]">No files</div>
                  ) : (
                    <ul className="text-sm list-disc ml-5">
                      {files.map((f) => (
                        <li key={f.file_id} className="flex items-center justify-between gap-3">
                          <span>
                            {f.name} ({f.size} bytes)
                          </span>
                          <button className="btn ghost" onClick={() => removeFile(f.file_id)}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div>
                    <input
                      className="block w-full text-sm"
                      type="file"
                      multiple
                      accept="*/*"
                      onChange={(e) => setNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                    />
                    <div className="text-xs text-gray-600 mt-1">Add files. Any type.</div>
                  </div>
                </>
              )}
            </section>
            <footer>
              <button className="btn ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button className="btn" onClick={save}>
                {isAdmin ? "Save changes" : "Save allowed fields"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
