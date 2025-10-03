/* frontend/src/components/ui/ErrorBanner.tsx */
import React from "react";

type Kind = "error" | "warn" | "info";

export default function ErrorBanner({
  kind = "error",
  children,
}: {
  kind?: Kind;
  children: React.ReactNode;
}) {
  const palette =
    kind === "warn"
      ? { text: "text-amber-800", bg: "bg-amber-50", border: "border-amber-200" }
      : kind === "info"
      ? { text: "text-blue-800", bg: "bg-blue-50", border: "border-blue-200" }
      : { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  return (
    <div className={`text-sm ${palette.text} ${palette.bg} border ${palette.border} rounded-md p-2`}>
      {children}
    </div>
  );
}
