// frontend/src/app/dashboard/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import {
  type Me,
  fetchMe,
  adminListReferrals,
  fetchMyReferrals,
  getAnnouncements,
} from '@/lib/api';

type Ref = {
  id: string;
  ref_no: string;
  company: string;
  status: string;
  created_at?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="card">{children}</div>
);

export default function DashboardPage() {
  // auth gate
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<Me | null>(null);

  // data
  const [refs, setRefs] = useState<Ref[]>([]);
  const [ann, setAnn] = useState<string[]>([]);

  const isAdmin = me?.role === 'COVENANT';

  // ---------- AUTH GATE ----------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await fetchMe();
        if (!alive) return;
        setMe(m);
      } catch {
        if (!alive) return;
        setMe(null);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ---------- LOAD DATA ----------
  useEffect(() => {
    if (!ready || !me) return;
    let alive = true;
    (async () => {
      try {
        const doc: any = await getAnnouncements();
        const items = Array.isArray(doc?.items) ? doc.items : [];
        if (alive) setAnn(items);
      } catch {
        if (alive) setAnn([]);
      }

      try {
        const response = isAdmin ? await adminListReferrals() : await fetchMyReferrals();
        const data = response?.items || response;
        if (alive) setRefs(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setRefs([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ready, me, isAdmin]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    refs.forEach((r) => {
      m[r.status] = (m[r.status] || 0) + 1;
    });
    return m;
  }, [refs]);

  if (!ready) return null;
  if (!me) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="text-sm opacity-70">Please sign in to view the dashboard.</p>
        <div className="mt-4">
          <Link className="btn ghost" href="/" prefetch={false}>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="wrap space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isAdmin ? 'Admin Dashboard' : 'My Dashboard'}</h1>
        <Link href="/create-referral" className="btn">
          Submit Referral
        </Link>
      </div>

      {/* Announcements */}
      <Card>
        <h2 className="text-lg font-medium mb-2">Announcements</h2>
        {ann.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No announcements.</div>
        ) : (
          <ul className="list-disc ml-5 text-sm">
            {ann.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </Card>

      {/* Status Summary */}
      <Card>
        <h2 className="text-lg font-medium mb-2">Status Summary</h2>
        <div
          className="grid"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}
        >
          {[
            'New',
            'Contacted',
            'Qualified',
            'Proposal Sent',
            'Won',
            'Lost',
            'On Hold',
            'Commission Paid',
          ].map((s) => (
            <div key={s} className="card" style={{ padding: 12 }}>
              <div className="label">{s}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{counts[s] || 0}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* All Referrals (Admin only) */}
      {isAdmin && (
        <Card>
          <h2 className="text-lg font-medium mb-2">All Referrals</h2>
          <div className="overflow-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Ref No</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ width: 80 }}>View</th>
                </tr>
              </thead>
              <tbody>
                {refs.map((r) => (
                  <tr key={r.id}>
                    <td>{r.ref_no}</td>
                    <td>{r.company}</td>
                    <td><Badge status={r.status} /></td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
                    <td>
                      <Link className="btn ghost" href={`/referral`} prefetch={false}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {refs.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 12 }}>
                      No referrals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
