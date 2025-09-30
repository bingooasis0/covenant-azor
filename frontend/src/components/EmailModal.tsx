"use client";

import React, { useState } from "react";
import { apiFetch, API_BASE } from "@/lib/api";

type Props = {
  onClose: () => void;
};

export default function EmailModal({ onClose }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function send() {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setErr("You must be signed in.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await apiFetch("/support/contact", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `Request failed (${res.status})`);
      }
      setOk(true);
      setMessage("");
      onClose();
    } catch (e: any) {
      setErr(e?.message || "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <header>
          <div>Contact Support</div>
          <button className="btn ghost" onClick={onClose}>Close</button>
        </header>
        <section className="space-y-3">
          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{err}</div>}
          <textarea
            className="input w-full min-h-[140px]"
            placeholder="Describe your issue…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </section>
        <footer>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy || !message.trim()} onClick={send}>
            {busy ? "Sending…" : "Send"}
          </button>
        </footer>
      </div>
    </div>
  );
}
