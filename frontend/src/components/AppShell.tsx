
"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import { ToastProvider } from "./Toast";

export default function AppShell({ children }:{children:React.ReactNode }){
  const path = usePathname();
  const isLogin = path === "/" || path === "/login";
  if (isLogin) return <ToastProvider><div className="min-h-screen flex items-center justify-center">{children}</div></ToastProvider>;
  return (
    <ToastProvider>
      <div className="app">
        <Sidebar />
        <div className="content w-full">{children}</div>
      </div>
    </ToastProvider>
  );
}
