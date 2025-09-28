/* frontend/src/app/create-referral/page.tsx */
"use client";

import React, { useMemo, useReducer, useState } from "react";
import { createReferral, type CreateReferralPayload } from "@/lib/api";

type State = {
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  locationsCsv: string;

  managed_it: boolean;
  hosted_voice: boolean;
  network_wifi: boolean;
  structured_cabling: boolean;
  opportunity_other: string;

  env_users: string;
  env_phone_provider: string;
  env_isp: string;
  env_bandwidth: string;
  env_it_model: string;

  reason: string;

  rep_name: string;
  rep_email: string;
  referral_date: string;

  notes: string;
  files: File[];
};

type Action =
  | { type: "field"; name: keyof State; value: any }
  | { type: "files"; files: File[] }
  | { type: "reset" };

const init: State = {
  company: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  locationsCsv: "",

  managed_it: false,
  hosted_voice: false,
  network_wifi: false,
  structured_cabling: false,
  opportunity_other: "",

  env_users: "",
  env_phone_provider: "",
  env_isp: "",
  env_bandwidth: "",
  env_it_model: "",

  reason: "",
  rep_name: "",
  rep_email: "",
  referral_date: new Date().toISOString().slice(0, 10),

  notes: "",
  files: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "field":
      return { ...state, [action.name]: action.value };
    case "files":
      return { ...state, files: action.files };
    case "reset":
      return { ...init, referral_date: new Date().toISOString().slice(0, 10) };
    default:
      return state;
  }
}

const MAX_FILES = 10, MAX_FILE_MB = 25, MAX_TOTAL_MB = 100;

export default function CreateReferralPage() {
  const [s, dispatch] = useReducer(reducer, init);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type, checked } = e.target as any;
    dispatch({ type: "field", name, value: type === "checkbox" ? !!checked : value });
  }

  function onFiles(list: FileList | null) {
    const arr = list ? Array.from(list) : [];
    if (arr.length > MAX_FILES) { setErr(`Max ${MAX_FILES} files`); return; }
    const total = arr.reduce((s, x) => s + x.size, 0) / (1024*1024);
    if (total > MAX_TOTAL_MB) { setErr(`Max total ${MAX_TOTAL_MB} MB`); return; }
    for (const x of arr) { if (x.size/(1024*1024) > MAX_FILE_MB) { setErr(`File ${x.name} exceeds ${MAX_FILE_MB} MB`); return; } }
    setErr(null);
    dispatch({ type: "files", files: arr });
  }

  function pickOpp(): string[] {
    const ops: string[] = [];
    if (s.managed_it) ops.push("Managed IT");
    if (s.hosted_voice) ops.push("Hosted Voice / Phone");
    if (s.network_wifi) ops.push("Network / Wi-Fi");
    if (s.structured_cabling) ops.push("Structured Cabling");
    if (s.opportunity_other.trim()) ops.push(s.opportunity_other.trim());
    return ops;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr(null); setOk(null);

    const payload: CreateReferralPayload = {
      company: s.company,
      contact_name: s.contact_name,
      contact_email: s.contact_email,
      contact_phone: s.contact_phone,
      locations: s.locationsCsv.split(",").map(t=>t.trim()).filter(Boolean),
      opportunity_types: pickOpp(),
      environment: {
        users: s.env_users ? Number(s.env_users) : undefined,
        phone_provider: s.env_phone_provider || undefined,
        internet_provider: s.env_isp || undefined,
        internet_bandwidth_mbps: s.env_bandwidth ? Number(s.env_bandwidth) : undefined,
        it_model: s.env_it_model || undefined,
      },
      reason: s.reason || undefined,
      rep_name: s.rep_name || undefined,
      rep_email: s.rep_email || undefined,
      referral_date: s.referral_date || undefined,
      notes: s.notes || undefined,
    };

    try {
      const created = await createReferral(payload);
      const id = created?.id;
      if (!id) throw new Error("Server did not return id");
      if (s.files.length > 0) {
        const fd = new FormData();
        for (const file of s.files) fd.append("files", file, file.name);
        const res = await fetch((process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000") + `/referrals/${id}/files`, {
          method: "POST",
          credentials: "include",
          body: fd,
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setOk("Referral submitted");
      dispatch({ type: "reset" });
    } catch (e: any) {
      setErr(e?.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  }

  const filesPreview = useMemo(()=> s.files.map(f => ({name:f.name, type:f.type, size:f.size})), [s.files]);

  const Label = ({children}:{children:React.ReactNode}) => <label className="block text-sm font-medium mb-1">{children}</label>;
  const Input = (props:any) => <input {...props} className={`input ${props.className||""}`} />;
  const Text = (props:any) => <textarea {...props} className={`input min-h-[120px] ${props.className||""}`} />;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Create referral</h1>
        <a href="/referral" className="text-sm text-blue-700 hover:underline">Back to referrals</a>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Customer Company Name</Label><Input name="company" value={s.company} onChange={onChange} /></div>
          <div><Label>Customer Location(s)</Label><Input name="locationsCsv" placeholder="Comma-separated" value={s.locationsCsv} onChange={onChange} /></div>
          <div><Label>Primary Contact Name</Label><Input name="contact_name" value={s.contact_name} onChange={onChange} /></div>
          <div><Label>Primary Contact Email</Label><Input name="contact_email" type="email" value={s.contact_email} onChange={onChange} /></div>
          <div><Label>Primary Contact Phone</Label><Input name="contact_phone" value={s.contact_phone} onChange={onChange} /></div>
        </div>

        <div>
          <Label>Opportunity Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <label className="inline-flex items-center gap-2 text-sm"><input name="managed_it" type="checkbox" checked={s.managed_it} onChange={onChange} /><span>Managed IT</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input name="hosted_voice" type="checkbox" checked={s.hosted_voice} onChange={onChange} /><span>Hosted Voice / Phone</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input name="network_wifi" type="checkbox" checked={s.network_wifi} onChange={onChange} /><span>Network / Wi-Fi</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input name="structured_cabling" type="checkbox" checked={s.structured_cabling} onChange={onChange} /><span>Structured Cabling</span></label>
            <div className="flex items-center gap-2 text-sm">
              <span>Other:</span>
              <Input name="opportunity_other" value={s.opportunity_other} onChange={onChange} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Users count</Label><Input name="env_users" type="number" inputMode="numeric" value={s.env_users} onChange={onChange} /></div>
          <div><Label>Phone provider</Label><Input name="env_phone_provider" value={s.env_phone_provider} onChange={onChange} /></div>
          <div><Label>Internet provider</Label><Input name="env_isp" value={s.env_isp} onChange={onChange} /></div>
          <div><Label>Internet bandwidth (Mbps)</Label><Input name="env_bandwidth" type="number" inputMode="decimal" value={s.env_bandwidth} onChange={onChange} /></div>
          <div className="md:col-span-2"><Label>IT support model</Label><Input name="env_it_model" value={s.env_it_model} onChange={onChange} /></div>
        </div>

        <div><Label>Reason for referral</Label><Input name="reason" value={s.reason} onChange={onChange} /></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Rep name</Label><Input name="rep_name" value={s.rep_name} onChange={onChange} /></div>
          <div><Label>Rep email</Label><Input name="rep_email" type="email" value={s.rep_email} onChange={onChange} /></div>
          <div><Label>Date of referral</Label><Input name="referral_date" type="date" value={s.referral_date} onChange={onChange} /></div>
        </div>

        <div><Label>Additional notes</Label><Text name="notes" value={s.notes} onChange={onChange} /></div>

        <div>
          <Label>Attachments</Label>
          <input className="block w-full text-sm" type="file" multiple accept="*/*" onChange={(e)=>onFiles(e.target.files)} />
          <div className="text-xs text-gray-600 mt-1">Max {MAX_FILES} files, ≤ {MAX_FILE_MB} MB each, total ≤ {MAX_TOTAL_MB} MB.</div>
          {err && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2 mt-2">{err}</div>}
          {filesPreview.length>0 && (
            <div className="mt-2 text-xs text-gray-600">
              <div className="font-semibold">Selected files</div>
              <ul className="list-disc ml-5">{filesPreview.map(f => (<li key={f.name}>{f.name} ({f.type || "application/octet-stream"}, {f.size} bytes)</li>))}</ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn">{busy ? "Submitting…" : "Submit referral"}</button>
        </div>

        {ok && <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-2">{ok}</div>}
      </form>
    </div>
  );
}
