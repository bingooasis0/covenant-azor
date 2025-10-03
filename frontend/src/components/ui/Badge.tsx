import React from "react";

type Status = "New"|"Contacted"|"Qualified"|"Proposal Sent"|"Won"|"Lost"|"On Hold"|"Commission Paid";

const FALLBACK: Record<Status, string> = {
  New:"bg-blue-100 text-blue-800 border-blue-200",
  Contacted:"bg-amber-100 text-amber-800 border-amber-200",
  Qualified:"bg-yellow-100 text-yellow-800 border-yellow-200",
  "Proposal Sent":"bg-indigo-100 text-indigo-800 border-indigo-200",
  Won:"bg-green-100 text-green-800 border-green-200",
  Lost:"bg-red-100 text-red-800 border-red-200",
  "On Hold":"bg-zinc-100 text-zinc-800 border-zinc-200",
  "Commission Paid":"bg-emerald-100 text-emerald-900 border-emerald-200"
};

const ICONS: Record<Status, React.ReactNode> = {
  "New": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" strokeDasharray="4 4"/>
    </svg>
  ),
  "Contacted": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>
  ),
  "Qualified": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
    </svg>
  ),
  "Proposal Sent": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
    </svg>
  ),
  "Won": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  "Lost": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  "On Hold": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  "Commission Paid": (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
};

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export default function Badge({ status }: { status: Status | string }) {
  const s = (status as Status) || "New";
  const tw = FALLBACK[s] || "bg-zinc-100 text-zinc-800 border-zinc-200";
  const icon = ICONS[s] || null;
  const css = `badge ${slug(s)}`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${css} ${tw}`}>
      {icon}
      {status}
    </span>
  );
}
