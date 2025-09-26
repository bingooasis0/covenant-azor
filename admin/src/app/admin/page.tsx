
"use client";
export default function AdminHome(){
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card"><h2 className="font-semibold mb-2">Users</h2><div className="muted text-sm">Users card goes here.</div></div>
        <div className="card"><h2 className="font-semibold mb-2">Referrals</h2><div className="muted text-sm">Referrals card goes here.</div></div>
        <div className="card"><h2 className="font-semibold mb-2">Audit Logs</h2><div className="muted text-sm">Audit card goes here.</div></div>
      </div>
    </div>
  );
}
