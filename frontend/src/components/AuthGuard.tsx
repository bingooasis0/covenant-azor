"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { fetchMe } from "@/lib/api";

const PUBLIC_ROUTES = ['/', '/login'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Skip auth check for public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      setIsAuthenticated(true);
      return;
    }

    async function checkAuth() {
      try {
        // Check if token exists in localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (!token) {
          console.warn('[AuthGuard] No token found, redirecting to login');
          setIsAuthenticated(false);
          router.push('/');
          return;
        }

        // Verify token by fetching user data
        const user = await fetchMe();

        if (!user || !user.id) {
          console.warn('[AuthGuard] Invalid user data, redirecting to login');
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'azor_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          router.push('/');
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.error('[AuthGuard] Authentication check failed:', error);
        setIsAuthenticated(false);

        // Clear invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
          document.cookie = 'azor_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        }

        router.push('/');
      }
    }

    checkAuth();
  }, [pathname, router]);

  // Show loading state while checking authentication
  if (isAuthenticated === null && !PUBLIC_ROUTES.includes(pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (isAuthenticated === false && !PUBLIC_ROUTES.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
