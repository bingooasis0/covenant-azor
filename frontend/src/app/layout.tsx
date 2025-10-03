
import '../styles/globals.css';
import React from 'react';
import AppShell from '../components/AppShell';

export const metadata = {
  title: "Covenant Partner Portal",
  description: "Partner Portal",
  icons: {
    icon: '/images/logo-blue.ico',
  }
};

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="en"><body><AppShell>{children}</AppShell></body></html>);
}
