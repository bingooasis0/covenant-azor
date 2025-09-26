
import '../styles/globals.css';
import React from 'react';
import AppShell from '../components/AppShell';

export const metadata = { title:"Covenant Azor", description:"Partner Portal" };

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="en"><body><AppShell>{children}</AppShell></body></html>);
}
