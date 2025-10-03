/* frontend/src/app/create-referral/page.tsx */
"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createReferral, updateReferral } from "@/lib/api";

const MAX_FILES = 10, MAX_FILE_MB = 25, MAX_TOTAL_MB = 100;

type FileWithProgress = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'scanning' | 'complete' | 'error';
  error?: string;
};

function getFileIcon(filename: string) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const iconClass = "w-5 h-5";

  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
    return (
      <svg className={iconClass + " text-amber-600"} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm0 4h2v2h-2V9z"/>
      </svg>
    );
  }

  if (ext === '.pdf') {
    return (
      <svg className={iconClass + " text-red-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
    return (
      <svg className={iconClass + " text-green-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
      </svg>
    );
  }

  if (['.txt', '.md', '.log'].includes(ext)) {
    return (
      <svg className={iconClass + " text-gray-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    );
  }

  if (['.doc', '.docx'].includes(ext)) {
    return (
      <svg className={iconClass + " text-blue-700"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  if (['.xls', '.xlsx', '.csv'].includes(ext)) {
    return (
      <svg className={iconClass + " text-green-700"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  return (
    <svg className={iconClass + " text-blue-600"} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
    </svg>
  );
}

export default function CreateReferralPage(){
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [busy,setBusy] = useState(false);
  const [err,setErr] = useState<string|null>(null);
  const [fileList, setFileList] = useState<FileWithProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [referralId, setReferralId] = useState<string | null>(null);

  // Create draft referral on mount
  React.useEffect(() => {
    (async () => {
      try {
        // Create a draft referral with minimal data
        const draft = await createReferral({
          company: "Draft",
          contact_name: "Draft",
          contact_email: "draft@example.com",
          contact_phone: "000-000-0000",
          locations: [],
          opportunity_types: []
        });
        if (draft?.id) {
          setReferralId(draft.id);
        }
      } catch (e) {
        console.error("Failed to create draft referral:", e);
      }
    })();
  }, []);

  async function uploadFile(file: File, index: number, refId: string) {
    // Validate file type
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.msi', '.dll', '.vbs', '.ps1'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (dangerousExtensions.includes(ext)) {
      setFileList(prev => prev.map((f, idx) =>
        idx === index ? { ...f, status: 'error', error: `File type ${ext} not allowed` } : f
      ));
      return;
    }

    // Update to uploading
    setFileList(prev => prev.map((f, idx) =>
      idx === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    const uploadFd = new FormData();
    uploadFd.append("file", file, file.name);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setFileList(prev => prev.map((f, idx) =>
            idx === index ? { ...f, progress: percent } : f
          ));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setFileList(prev => prev.map((f, idx) =>
            idx === index ? { ...f, status: 'scanning', progress: 100 } : f
          ));
          setTimeout(() => {
            setFileList(prev => prev.map((f, idx) =>
              idx === index ? { ...f, status: 'complete' } : f
            ));
            resolve();
          }, 500);
        } else {
          const response = xhr.responseText;
          let errorMsg = `Upload failed: ${xhr.status}`;
          try {
            const json = JSON.parse(response);
            errorMsg = json.detail || errorMsg;
          } catch {}
          setFileList(prev => prev.map((f, idx) =>
            idx === index ? { ...f, status: 'error', error: errorMsg } : f
          ));
          reject(new Error(errorMsg));
        }
      });

      xhr.addEventListener('error', () => {
        setFileList(prev => prev.map((f, idx) =>
          idx === index ? { ...f, status: 'error', error: 'Upload failed' } : f
        ));
        reject(new Error('Upload failed'));
      });

      const token = localStorage.getItem("token");
      xhr.open('POST', (process.env.NEXT_PUBLIC_API_BASE||"http://127.0.0.1:8000")+`/referrals/${refId}/files`);
      xhr.withCredentials = true;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(uploadFd);
    });
  }

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

      const payload: any = {
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
          internet_bandwidth_mbps: String(fd.get("env_bandwidth") || "") || undefined,
          it_model: String(fd.get("env_it_model") || "") || undefined,
        },
        reason: String(fd.get("reason") || "") || undefined,
        rep_name: String(fd.get("rep_name") || "") || undefined,
        rep_email: String(fd.get("rep_email") || "") || undefined,
        referral_date: String(fd.get("referral_date") || "") || undefined,
        notes: String(fd.get("notes") || "") || undefined,
      };

      // Update the draft referral with actual data
      if (referralId) {
        await updateReferral(referralId, payload);
      } else {
        // Fallback: create new referral if no draft exists
        const created = await createReferral(payload);
        if (!created?.id) throw new Error("Server did not return id");
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

      {err && <div className="text-sm bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">{err}</div>}

      <form ref={formRef} onSubmit={onSubmit} className="space-y-6" noValidate>
        <div className="card"><h2 className="text-base font-semibold mb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Customer Company Name <span className="text-red-500">*</span></label>
              <input name="company" className="input w-full" placeholder="e.g., Acme Corporation" required/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Primary Contact Name <span className="text-red-500">*</span></label>
              <input name="contact_name" className="input w-full" placeholder="e.g., John Smith" required/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Primary Contact Email <span className="text-red-500">*</span></label>
              <input name="contact_email" type="email" className="input w-full" placeholder="e.g., john@company.com" required/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Primary Contact Phone <span className="text-red-500">*</span></label>
              <input name="contact_phone" className="input w-full" placeholder="e.g., (555) 123-4567" required/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Customer Location(s)</label>
              <input name="locationsCsv" className="input w-full" placeholder="e.g., New York, Boston"/>
              <p className="text-xs text-gray-500 mt-1">Comma-separated if multiple</p>
            </div>
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

        <div className="card"><h2 className="text-base font-semibold mb-3">Customer Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5"># of Users / Employees</label>
              <input name="env_users" type="number" inputMode="numeric" className="input w-full" placeholder="e.g., 25"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Internet Bandwidth / Speed</label>
              <input name="env_bandwidth" type="text" className="input w-full" placeholder="e.g., 100x100, 500/50, 1Gbps"/>
              <p className="text-xs text-gray-500 mt-1">Enter as shown by ISP (e.g., 100x100, 500/50)</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Phone Provider</label>
              <input name="env_phone_provider" className="input w-full" placeholder="e.g., RingCentral, Vonage, 8x8"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Internet Provider</label>
              <input name="env_isp" className="input w-full" placeholder="e.g., Comcast, Verizon, Spectrum"/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1.5">Current IT Support Model</label>
              <input name="env_it_model" className="input w-full" placeholder="e.g., In-house IT, External MSP, No formal support"/>
            </div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-3">Reason for Referral</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">What triggered this referral?</label>
            <input name="reason" className="input w-full" placeholder="e.g., They mentioned needing faster internet, experiencing frequent downtime"/>
            <p className="text-xs text-gray-500 mt-1">Describe what the customer mentioned or what problem they're experiencing</p>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-3">Referral Source</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Azor Rep Name</label>
              <input name="rep_name" className="input w-full" placeholder="e.g., Jane Doe"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Azor Rep Email</label>
              <input name="rep_email" type="email" className="input w-full" placeholder="e.g., jane@azor.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date of Referral</label>
              <input name="referral_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="input w-full"/>
            </div>
          </div>
        </div>

        <div className="card"><h2 className="text-base font-semibold mb-3">Additional Notes & Attachments</h2>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
              <textarea name="notes" className="input w-full min-h-[120px]" placeholder="Any additional details about the customer, opportunity, or special considerations..."/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Attachments</label>
              <div className="flex items-center gap-2">
                <label className="btn ghost cursor-pointer">
                  <input
                    ref={filesRef}
                    className="hidden"
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={async (e) => {
                      if (e.target.files && referralId) {
                        const currentLength = fileList.length;
                        const newFiles = Array.from(e.target.files).map(file => ({
                          file,
                          progress: 0,
                          status: 'pending' as const
                        }));
                        setFileList((prev) => [...prev, ...newFiles]);
                        e.target.value = "";

                        // Upload files immediately
                        for (let i = 0; i < newFiles.length; i++) {
                          try {
                            await uploadFile(newFiles[i].file, currentLength + i, referralId);
                          } catch (err) {
                            console.error('File upload failed:', err);
                          }
                        }
                      } else if (!referralId) {
                        alert("Please wait for the page to load before uploading files");
                      }
                    }}
                  />
                  Upload Files
                </label>
                {fileList.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {fileList.length} file{fileList.length !== 1 ? "s" : ""} attached
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-600 mt-1">Any type. Max {MAX_FILES} files, ≤ {MAX_FILE_MB} MB each, total ≤ {MAX_TOTAL_MB} MB.</div>
              {fileList.length > 0 && (
                <div className="mt-3 space-y-2">
                  {fileList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md"
                    >
                      {/* File icon */}
                      <div className="flex-shrink-0 w-10 h-10 bg-white border border-gray-300 rounded flex items-center justify-center mt-0.5">
                        {getFileIcon(item.file.name)}
                      </div>
                      {/* File info and progress */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.file.name}
                        </div>
                        <div className="text-xs text-gray-500 mb-1.5">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </div>
                        {/* Progress bar */}
                        {item.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 w-8">0%</span>
                            <div className="w-32 bg-gray-200 rounded-full h-1">
                              <div className="h-1 rounded-full w-0"></div>
                            </div>
                          </div>
                        )}
                        {item.status === 'uploading' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-8">{item.progress}%</span>
                            <div className="w-32 bg-gray-200 rounded-full h-1">
                              <div
                                className="h-1 rounded-full transition-all duration-300"
                                style={{
                                  width: `${item.progress}%`,
                                  background: 'linear-gradient(to left, #0f2027, #203a43, #2c5364)'
                                }}
                              />
                            </div>
                          </div>
                        )}
                        {item.status === 'scanning' && (
                          <div className="flex items-center gap-1.5 text-xs text-blue-600">
                            <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Scanning with VirusTotal...</span>
                          </div>
                        )}
                        {item.status === 'complete' && (
                          <div className="text-xs text-green-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span>Ready</span>
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="text-xs text-red-600">{item.error || "Upload failed"}</div>
                        )}
                      </div>
                      {/* Remove button */}
                      <button
                        type="button"
                        className="btn ghost text-xs px-2 py-1 flex-shrink-0"
                        onClick={() => setFileList((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={item.status === 'uploading' || item.status === 'scanning'}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <a href="/referral" className="btn ghost">Cancel</a>
          <button type="submit" disabled={busy || uploading} className="btn">{busy || uploading ? "Submitting…" : "Submit referral"}</button>
        </div>
      </form>
    </div>
  );
}
