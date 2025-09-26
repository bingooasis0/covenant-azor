// frontend/src/hooks/useRequireRole.ts
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMe } from "@/lib/api";

export function useRequireRole(requiredRole: "COVENANT" | "AZOR") {
  const router = useRouter();
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await fetchMe();
        if (me?.role === requiredRole) { if (alive) setGranted(true); }
        else { router.replace("/dashboard"); }
      } catch { router.replace("/"); }
    })();
    return () => { alive = false; };
  }, [router, requiredRole]);
  return granted;
}
