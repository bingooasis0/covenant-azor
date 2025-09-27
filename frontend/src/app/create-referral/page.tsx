// frontend/src/app/create-referral/page.tsx
"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { createReferral } from "@/lib/api/index";

type FormState = {
  company: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  locations: string;
  opportunity_types: string;
  environment: string;
  reason: string;
  rep_name: string;
  rep_email: string;
  date: string;
  notes: string;
  attachmentDataUrl?: string;
};

export default function CreateReferralPage() {
  const [form, setForm] = useState<FormState>({
    company: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    locations: "",
    opportunity_types: "",
    environment: "",
    reason: "",
    rep_name: "",
    rep_email: "",
    date: new Date().toISOString().slice(0,10),
    notes: "",
    attachmentDataUrl: undefined,
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleFile(file?: File) {
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxBytes) { alert("Max file size is 5 MB."); return; }
    const okTypes = ["application/pdf","image/png","image/jpeg","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!okTypes.includes(file.type)) { alert("Unsupported file type."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const head = dataUrl.split(",")[0];               // e.g., data:application/pdf;base64
      const base64 = dataUrl.split(",")[1] || "";
      const preview = `${head},${base64.slice(0,64)}…`;
      const appended = form.notes ? `${form.notes}\n\nAttachment(inline): ${preview}` : `Attachment(inline): ${preview}`;
      set("attachmentDataUrl", dataUrl);
      set("notes", appended);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, any> = { ...form };
    // backend stores inline preview inside notes; keep attachmentDataUrl field too
    await createReferral(payload);
    alert("Referral submitted");
    setForm({ ...form, company:"", contact_name:"", contact_email:"", contact_phone:"", locations:"", opportunity_types:"", environment:"", reason:"", rep_name:"", rep_email:"", date:new Date().toISOString().slice(0,10), notes:"", attachmentDataUrl: undefined });
  }

  const Section = ({title, children}:{title:string; children:React.ReactNode}) => (
    <div className="card">
      <h2 style={{fontSize:16, fontWeight:600, marginBottom:10}}>{title}</h2>
      <div className="grid" style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <h1 style={{fontSize:20, fontWeight:600}}>Create Referral</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Section title="Customer">
          <div><label className="label">Customer Company Name</label><input className="input w-full" value={form.company} onChange={e=>set("company", e.target.value)} /></div>
          <div><label className="label">Customer Location(s)</label><input className="input w-full" placeholder="Comma-separated" value={form.locations} onChange={e=>set("locations", e.target.value)} /></div>
          <div><label className="label">Primary Contact Name</label><input className="input w-full" value={form.contact_name} onChange={e=>set("contact_name", e.target.value)} /></div>
          <div><label className="label">Primary Contact Email</label><input className="input w-full" type="email" value={form.contact_email} onChange={e=>set("contact_email", e.target.value)} /></div>
          <div><label className="label">Primary Contact Phone</label><input className="input w-full" value={form.contact_phone} onChange={e=>set("contact_phone", e.target.value)} /></div>
          <div><label className="label">Date of Referral</label><input className="input w-full" type="date" value={form.date} onChange={e=>set("date", e.target.value)} /></div>
        </Section>

        <Section title="Opportunity Type">
          <div className="col-span-2">
            <div className="grid" style={{display:"grid", gridTemplateColumns:"repeat(4, minmax(0,1fr))", gap:8}}>
              {["Managed IT","Hosted Voice / Phone","Network / Wi‑Fi","Structured Cabling"].map((label) => (
                <label key={label} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={form.opportunity_types.includes(label)} onChange={(e)=> {
                    const list = new Set(form.opportunity_types.split(",").map(s=>s.trim()).filter(Boolean));
                    if (e.target.checked) list.add(label); else list.delete(label);
                    set("opportunity_types", Array.from(list).join(", "));
                  }} />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2"><label className="label">Other</label><input className="input w-full" value={form.environment} onChange={e=>set("environment", e.target.value)} /></div>
        </Section>

        <Section title="Environment">
          <div className="col-span-2"><label className="label">Customer Environment</label><input className="input w-full" value={form.environment} onChange={e=>set("environment", e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Reason for Referral</label><input className="input w-full" placeholder="Trigger statement" value={form.reason} onChange={e=>set("reason", e.target.value)} /></div>
        </Section>

        <Section title="Agent">
          <div><label className="label">Referral Rep Name</label><input className="input w-full" value={form.rep_name} onChange={e=>set("rep_name", e.target.value)} /></div>
          <div><label className="label">Referral Rep Email</label><input className="input w-full" type="email" value={form.rep_email} onChange={e=>set("rep_email", e.target.value)} /></div>
        </Section>

        <Section title="Notes & Attachment">
          <div className="col-span-2"><label className="label">Additional Notes</label><textarea className="input w-full min-h-[120px]" value={form.notes} onChange={e=>set("notes", e.target.value)} /></div>
          <div className="col-span-2"><label className="label">Upload file (optional)</label><input className="input w-full" type="file" onChange={e=>handleFile(e.target.files?.[0])} /></div>
        </Section>

        <div className="flex justify-end gap-3">
          <Button type="submit">Submit referral</Button>
          {form.attachmentDataUrl ? <span className="text-sm text-gray-600">Attachment inlined into notes.</span> : null}
        </div>
      </form>
    </div>
  );
}
