
"use client";
import { ToastProvider } from "./Toast";
export default function Providers({ children }:{children:React.ReactNode}){ return <ToastProvider>{children}</ToastProvider>; }
