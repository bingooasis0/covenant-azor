
"use client";
import Link from "next/link";

export default function AdminHome(){
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Portal</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/admin/users" className="card">Users</Link>
        <Link href="/admin/referrals" className="card">Referrals</Link>
        <Link href="/admin/audit" className="card">Audit Logs</Link>
      </div>
    </div>
  );
}
