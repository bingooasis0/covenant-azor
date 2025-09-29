/* frontend/src/app/create-referral/page.tsx */
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReferral, type CreateReferralPayload } from "@/lib/api";

const MAX_FILES = 10, MAX_FILE_MB = 25, MAX_TOTAL_MB = 100;

export default function CreateReferralPage(){
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    if (busy) return;
    setErr(null);

    const form = formRef.current!;
    if (!form.reportValidity()) return;

    setBusy(true);
    try{
      const fd = new FormData(form);

      const opportunity: string[] = [];
      if (fd.get("managed_it")) opportunity.push("Managed IT");
      if (fd.get("hosted_voice")) opportunity.push("Hosted Voice / Phone");
      if (fd.get("network_wifi")) opportunity.push("Network / Wi-Fi");
      if (fd.get("structured_cabling")) opportunity.push("Structured Cabling");
      const other = String(fd.get("opportunity_other") || "").trim();
      if (other) opportunity.push(other);

      const payload: CreateReferralPayload = {
        company: String(fd.get("company") || ""),
        contact_name: String(fd.get("contact_name") || ""),
        contact_email: String(fd.get("contact_email") || ""),
        contact_phone: String(fd.get("contact_phone") || ""),
        locations: String(fd.get("locationsCsv") || "").split(",").map(s=>s.trim()).filter(Boolean),
        opportunity_types: opportunity,
        environment: {
          users: fd.get("env_users") ? Number(fd.get("env_users")) : undefined,
          phone_provider: String(fd.get("env_phone_provider") || "") || undefined,
          internet_provider: String(fd.get("env_isp") || "") || undefined,
          internet_bandwidth_mbps: fd.get("env_bandwidth") ? Number(fd.get("env_bandwidth")) : undefined,
          it_model: String(fd.get("env_it_model") || "") || undefined,
        },
        reason: String(fd.get("reason") || "") || undefined,
        rep_name: String(fd.get("rep_name") || "") || undefined,
        rep_email: String(fd.get("rep_email") || "") || undefined,
        referral_date: String(fd.get("referral_date") || "") || undefined,
        notes: String(fd.get("notes") || "") || undefined,
      };

      const created = await createReferral(payload);
      const id = created?.id;
      if (!id) throw new Error("Server did not return id");

      const filesInput = filesRef.current;
      if (filesInput?.files?.length){
        const files = Array.from(filesInput.files);
        if (files.length > MAX_FILES) throw new Error(`Max ${MAX_FILES} files`);
        const total = files.reduce((s,f)=>s+f.size,0)/(1024*1024);
        if (total > MAX_TOTAL_MB) throw new Error(`Max total ${MAX_TOTAL_MB} MB`);
        for (const f of files) if ((f.size/(1024*1024)) > MAX_FILE_MB) throw new Error(`File ${f.name} exceeds ${MAX_FILE_MB} MB`);

        const uploadFd = new FormData();
        for (const f of files) uploadFd.append("files", f, f.name);

        const up = await fetch((process.env.NEXT_PUBLIC_API_BASE||"http://127.0.0.1:8000")+`/referrals/${id}/files`, {
          method: "POST",
          credentials: "include",
          body: uploadFd
        });
        if (!up.ok && up.status !== 404) {
          const t = await up.text();
          throw new Error(`Upload failed: ${up.status} ${t}`);
        }
      }

      router.push("/referral");
    }catch(e:any){
      setErr(e?.message || "Submit failed. Please correct highlighted fields.");
    }finally{
      setBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold">Create referral</h1><p className="text-sm text-[var(--muted)]">Complete the fields below, then submit.</p></div>
        <a href="/referral" className="btn ghost">Back to referrals</a>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="card"><h2 className="text-base font-semibold mb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Customer Company Name</label><input name="company" className="input w-full" placeholder="Company, LLC" required/></div>
            <div><label className="block text-sm font-medium mb-1">Customer Location(s)</label><input name="locationsCsv" className="input w-full" placeholder="Comma-separated list"/></div>
            <div><label className="block text-sm font-medium mb-1">Primary Contact Name</label><input name="contact_name" className="input w-full" required/></div>
            <div><label className="block text-sm font-medium mb-1">Primary Contact Email</label><input name="contact_email" type="email" className="input w-full" required/></div>
            <div><label className="block text-sm font-medium mb-1">Primary Contact Phone</label><input name="contact_phone" className="input w-full" required/></div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-2">Opportunity Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="inline-flex items-center gap-2 text-sm"><input name="managed_it" type="checkbox" /> <span>Managed IT (MSP Services)</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input name="hosted_voice" type="checkbox" /> <span>Hosted Voice / Phone System</span></label>
            <label className="inline-flex items-center gap-2 text-sm"><input name="network_wifi" type="checkbox" /> <span>Network / Wi-Fi Management</span></label>
            <label className="inline-flex items-center gap-2 text sm"><input name="structured_cabling" type="checkbox" /> <span>Structured Cabling Project</span></label>
            <div className="flex items-center gap-2 text-sm md:col-span-2"><span>Other:</span><input name="opportunity_other" className="input w-full" placeholder="Describe other work"/></div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-2">Customer Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1"># of Users / Employees</label><input name="env_users" type="number" inputMode="numeric" className="input w-full" placeholder="e.g., 25"/></div>
            <div><label className="block text sm font-medium mb-1">Current Phone System Provider</label><input name="env_phone_provider" className="input w-full"/></div>
            <div><label className="block text sm font-medium mb-1">Current Internet Provider</label><input name="env_isp" className="input w-full"/></div>
            <div><label className="block text sm font-medium mb-1">Internet Bandwidth (Mbps)</label><input name="env_bandwidth" type="number" inputMode="decimal" className="input w-full" placeholder="e.g., 300"/></div>
            <div className="md:col-span-2"><label className="block text sm font-medium mb-1">Current IT Support Model</label><input name="env_it_model" className="input w-full" placeholder="internal, external, none"/></div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-2">Reason for Referral (trigger statement)</h2>
          <div><input name="reason" className="input w-full" placeholder="e.g., They mentioned slow Wi-Fi"/></div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-2">Referral Source (Azor Rep)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text sm font-medium mb-1">Rep Name</label><input name="rep_name" className="input w-full"/></div>
            <div><label className="block text sm font-medium mb-1">Rep Email</label><input name="rep_email" type="email" className="input w-full"/></div>
            <div><label className="block text sm font-medium mb-1">Date of Referral</label><input name="referral_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="input w-full"/></div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-2">Additional Notes & Attachments</h2>
          <div className="grid grid-cols-1 gap-4">
            <div><label className="block text sm font-medium mb-1">Notes</label><textarea name="notes" className="input w-full min-h-[120px]"/></div>
            <div>
              <label className="block text sm font-medium mb-1">Attachments</label>
              <input ref={filesRef} className="block w-full text-sm" type="file" multiple accept="*/*"/>
              <div className="text-xs text-gray-600 mt-1">Any type. Max {MAX_FILES} files, ≤ {MAX_FILE_MB} MB each, total ≤ {MAX_TOTAL_MB} MB.</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <a href="/referral" className="btn ghost">Cancel</a>
          <button type="submit" disabled={busy} className="btn">{busy?"Submitting…":"Submit referral"}</button>
        </div>

        {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}
      </form>
    </div>
  );
}
