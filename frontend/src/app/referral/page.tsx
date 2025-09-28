/* frontend/src/app/referral/page.tsx */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { fetchMyReferrals, patchReferralAgent, type Referral } from "@/lib/api";

export default function ReferralPage() {
  const [rows, setRows] = useState<Referral[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sel, setSel] = useState<string>("");

  // edit fields
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [edit, setEdit] = useState(false);

  const selRef = useMemo(() => rows.find((r) => r.id === sel), [sel, rows]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyReferrals();
        setRows(data);
        if (data.length) setSel(data[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load referrals");
      }
    })();
  }, []);

  useEffect(() => {
    if (selRef) {
      setCompany(selRef.company || "");
      setName(selRef.contact_name || "");
      setEmail(selRef.contact_email || "");
      setPhone(selRef.contact_phone || "");
      setNotes(selRef.notes || "");
    }
  }, [selRef]);

  async function save() {
    if (!selRef) return;
    try {
      await patchReferralAgent(selRef.id, {
        company,
        contact_name: name,
        contact_email: email,
        contact_phone: phone,
        notes,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.id === selRef.id
            ? { ...r, company, contact_name: name, contact_email: email, contact_phone: phone, notes }
            : r
        )
      );
      setEdit(false);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Referral</h1>
        <a href="/create-referral" className="btn">Create Referral</a>
      </div>

      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Ref #</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Company</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Status</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Contact</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Email</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Phone</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Created</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="px-3 py-2">{r.ref_no}</td>
                <td className="px-3 py-2">{r.company}</td>
                <td className="px-3 py-2"><Badge status={r.status || "New"} /></td>
                <td className="px-3 py-2">{r.contact_name || "-"}</td>
                <td className="px-3 py-2">{r.contact_email || "-"}</td>
                <td className="px-3 py-2">{r.contact_phone || "-"}</td>
                <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : "-"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex gap-2 justify-end">
                    <button className="btn ghost" onClick={() => { setSel(r.id); setEdit(true); }}>Edit</button>
                    <a className="btn ghost" href={`/referral`}>View</a>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                  No referrals found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {edit && selRef && (
        <div className="modal-backdrop" onClick={() => setEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <div>Edit {selRef.ref_no}</div>
              <button className="btn ghost" onClick={()=>setEdit(false)}>Close</button>
            </header>
            <section className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="input" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                <input className="input" placeholder="Contact Name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className="input" type="email" placeholder="Contact Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="input" placeholder="Contact Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <textarea className="input w-full min-h-[120px]" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </section>
            <footer>
              <button className="btn ghost" onClick={()=>setEdit(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save changes</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
