// frontend/src/app/create-referral/page.tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { createReferral } from "@/lib/api";

/* The fields mirror the uploaded Azor → Covenant Referral Form. Extra fields are appended to 'notes' so the backend does not require a new schema. */

export default function CreateReferralPage() {
  const [form, setForm] = useState({
    company: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    locations: "",
    opportunity_types: {
      msp: false, voice: false, wifi: false, cabling: false, other: ""
    },
    environment: {
      users: "", phone_provider: "", internet_provider: "", it_model: ""
    },
    reason: "",
    rep_name: "",
    rep_email: "",
    date: new Date().toISOString().slice(0,10),
    notes: "",
    attachmentDataUrl: ""
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm({ ...form, [k]: v }); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const extra = [
      `Locations: ${form.locations}`,
      `Opportunity: ${[form.opportunity_types.msp&&"Managed IT", form.opportunity_types.voice&&"Hosted Voice", form.opportunity_types.wifi&&"Network/Wi-Fi", form.opportunity_types.cabling&&"Structured Cabling", form.opportunity_types.other].filter(Boolean).join(", ")}`,
      `Environment: users=${form.environment.users}, phone_provider=${form.environment.phone_provider}, internet_provider=${form.environment.internet_provider}, it_model=${form.environment.it_model}`,
      `Reason: ${form.reason}`,
      `Referral Source: ${form.rep_name} <${form.rep_email}> on ${form.date}`,
      form.attachmentDataUrl ? `Attachment(inline): ${form.attachmentDataUrl.slice(0,64)}…` : ""
    ].filter(Boolean).join("\n");

    const payload = {
      company: form.company,
      contact_name: form.contact_name,
      contact_email: form.contact_email,
      contact_phone: form.contact_phone,
      locations: form.locations.split(",").map(s=>s.trim()).filter(Boolean),
      notes: [form.notes, extra].filter(Boolean).join("\n\n")
    };

    await createReferral(payload);
    window.location.href = "/referral";
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    const dataUrl = `data:${file.type};base64,${b64}`;
    set("attachmentDataUrl", dataUrl);
  }

  return (
    <div className="p-6 space-y-6" style={{maxWidth:"900px"}}>
      <h1 className="text-xl font-semibold">Create Referral</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label className="label">Customer Company Name</label><input className="input" value={form.company} onChange={e=>set("company", e.target.value)} required /></div>
          <div><label className="label">Customer Location(s)</label><input className="input" value={form.locations} onChange={e=>set("locations", e.target.value)} placeholder="Comma-separated" /></div>
          <div><label className="label">Primary Contact Name</label><input className="input" value={form.contact_name} onChange={e=>set("contact_name", e.target.value)} required /></div>
          <div><label className="label">Primary Contact Email</label><input className="input" type="email" value={form.contact_email} onChange={e=>set("contact_email", e.target.value)} required /></div>
          <div><label className="label">Primary Contact Phone</label><input className="input" value={form.contact_phone} onChange={e=>set("contact_phone", e.target.value)} /></div>
        </div>

        <fieldset className="panel-2" style={{padding:12, borderRadius:12}}>
          <legend className="label" style={{padding:"0 6px"}}>Opportunity Type</legend>
          <div className="flex gap-6 flex-wrap">
            <label><input type="checkbox" checked={form.opportunity_types.msp} onChange={e=>set("opportunity_types",{...form.opportunity_types,msp:e.target.checked})}/> Managed IT</label>
            <label><input type="checkbox" checked={form.opportunity_types.voice} onChange={e=>set("opportunity_types",{...form.opportunity_types,voice:e.target.checked})}/> Hosted Voice / Phone</label>
            <label><input type="checkbox" checked={form.opportunity_types.wifi} onChange={e=>set("opportunity_types",{...form.opportunity_types,wifi:e.target.checked})}/> Network / Wi‑Fi</label>
            <label><input type="checkbox" checked={form.opportunity_types.cabling} onChange={e=>set("opportunity_types",{...form.opportunity_types,cabling:e.target.checked})}/> Structured Cabling</label>
            <label>Other <input className="input" style={{width:220}} value={form.opportunity_types.other} onChange={e=>set("opportunity_types",{...form.opportunity_types,other:e.target.value})}/></label>
          </div>
        </fieldset>

        <fieldset className="panel-2" style={{padding:12, borderRadius:12}}>
          <legend className="label" style={{padding:"0 6px"}}>Customer Environment</legend>
          <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
            <div><label className="label"># of Users / Employees</label><input className="input" value={form.environment.users} onChange={e=>set("environment",{...form.environment,users:e.target.value})}/></div>
            <div><label className="label">Current Phone System Provider</label><input className="input" value={form.environment.phone_provider} onChange={e=>set("environment",{...form.environment,phone_provider:e.target.value})}/></div>
            <div><label className="label">Current Internet Provider / Bandwidth Issues</label><input className="input" value={form.environment.internet_provider} onChange={e=>set("environment",{...form.environment,internet_provider:e.target.value})}/></div>
            <div><label className="label">Current IT Support Model</label><input className="input" value={form.environment.it_model} onChange={e=>set("environment",{...form.environment,it_model:e.target.value})}/></div>
          </div>
        </fieldset>

        <div><label className="label">Reason for Referral (trigger statement)</label><textarea className="input" rows={3} value={form.reason} onChange={e=>set("reason", e.target.value)} placeholder="Example: They mentioned slow Wi‑Fi…"/></div>

        <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
          <div><label className="label">Referral Rep Name</label><input className="input" value={form.rep_name} onChange={e=>set("rep_name", e.target.value)} /></div>
          <div><label className="label">Referral Rep Email</label><input className="input" type="email" value={form.rep_email} onChange={e=>set("rep_email", e.target.value)} /></div>
          <div><label className="label">Date of Referral</label><input className="input" type="date" value={form.date} onChange={e=>set("date", e.target.value)} /></div>
        </div>

        <div><label className="label">Additional Notes</label><textarea className="input" rows={4} value={form.notes} onChange={e=>set("notes", e.target.value)} /></div>

        <div><label className="label">Upload file (optional)</label><input className="input" type="file" onChange={e=>handleFile(e.target.files?.[0])} /></div>

        <div className="flex gap-8">
          <Button type="submit">Submit referral</Button>
          {form.attachmentDataUrl && <span className="text-sm text-gray-600">Attachment inlined into notes.</span>}
        </div>
      </form>
    </div>
  );
}
