/* frontend/src/components/ui/Badge.tsx */
import React from "react";

const map: Record<string,string> = {
  "New": "badge new",
  "Contacted": "badge contacted",
  "Won": "badge won",
  "Lost": "badge lost",
  "Commission Paid": "badge commission",
};

export default function Badge({ status }: { status: string }) {
  const cls = map[status] ?? "badge";
  return <span className={cls}>{status}</span>;
}
