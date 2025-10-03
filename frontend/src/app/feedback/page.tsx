/* frontend/src/app/feedback/page.tsx */
"use client";

import React, { useState } from "react";
import { fetchMe, type Me, http } from "@/lib/api";

type FileWithProgress = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'scanning' | 'complete' | 'error';
  error?: string;
  id?: string;
};

function getFileIcon(filename: string) {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const iconClass = "w-5 h-5";

  // ZIP files
  if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) {
    return (
      <svg className={iconClass + " text-amber-600"} fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm3 2h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm0 4h2v2h-2V9z"/>
      </svg>
    );
  }

  // PDF files
  if (ext === '.pdf') {
    return (
      <svg className={iconClass + " text-red-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  // Image files
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) {
    return (
      <svg className={iconClass + " text-green-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
      </svg>
    );
  }

  // Text files
  if (['.txt', '.md', '.log'].includes(ext)) {
    return (
      <svg className={iconClass + " text-gray-600"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
      </svg>
    );
  }

  // Word documents
  if (['.doc', '.docx'].includes(ext)) {
    return (
      <svg className={iconClass + " text-blue-700"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  // Excel files
  if (['.xls', '.xlsx', '.csv'].includes(ext)) {
    return (
      <svg className={iconClass + " text-green-700"} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
      </svg>
    );
  }

  // Default file icon
  return (
    <svg className={iconClass + " text-blue-600"} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
    </svg>
  );
}

export default function FeedbackPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState("");
  const [body, setBody] = useState("");
  const [fileList, setFileList] = useState<FileWithProgress[]>([]);

  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const u = await fetchMe();
        if (!cancelled) setMe(u);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function uploadFile(file: File, index: number) {
    // Update to uploading
    setFileList(prev => prev.map((f, idx) =>
      idx === index ? { ...f, status: 'uploading', progress: 0 } : f
    ));

    const uploadFd = new FormData();
    uploadFd.append("file", file, file.name);

    return new Promise<string>((resolve, reject) => {
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
          const response = JSON.parse(xhr.responseText);
          setFileList(prev => prev.map((f, idx) =>
            idx === index ? { ...f, status: 'complete', progress: 100, id: response.id } : f
          ));
          resolve(response.id);
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
      xhr.open('POST', (process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000") + "/feedback/files");
      xhr.withCredentials = true;
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.send(uploadFd);
    });
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message body are required.");
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      // Collect IDs of successfully uploaded files
      const attachment_ids = fileList
        .filter(f => f.status === 'complete' && f.id)
        .map(f => f.id);

      await http.post("/feedback/send", {
        subject: subject.trim(),
        body: body.trim(),
        cc: cc.trim() || null,
        attachment_ids: attachment_ids.length > 0 ? attachment_ids : null
      });

      setSuccess(true);
      setSubject("");
      setCc("");
      setBody("");
      setFileList([]);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.detail || e?.message || "Failed to send feedback.";
      setError(errorMsg);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Send Feedback</h1>
      </div>

      {/* Success banner */}
      {success && (
        <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-md p-3">
          Your feedback has been sent successfully!
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Feedback form */}
      <div className="card">
        <div className="space-y-4">
          {/* From (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              className="input w-full bg-gray-50"
              value={me?.email || ""}
              disabled
              readOnly
            />
          </div>

          {/* To (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              className="input w-full bg-gray-50"
              value="feedback@covenanttechnology.net"
              disabled
              readOnly
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CC (optional)</label>
            <input
              className="input w-full"
              type="email"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              className="input w-full"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              className="input w-full min-h-[300px] resize-y"
              placeholder="Enter your feedback or message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          {/* File attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="flex items-center gap-2">
              <label className="btn ghost cursor-pointer">
                <input
                  className="hidden"
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={async (e) => {
                    if (e.target.files) {
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
                          await uploadFile(newFiles[i].file, currentLength + i);
                        } catch (err) {
                          console.error('File upload failed:', err);
                        }
                      }
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

          {/* Send button */}
          <div className="flex justify-end pt-4">
            <button
              className="btn"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Feedback"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
