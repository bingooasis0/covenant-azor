
import '../styles/globals.css';
import React from 'react';

export const metadata = { title:"Covenant Admin Portal", description:"Admin" };

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (<html lang="en"><body><main className="wrapper py-8">{children}</main></body></html>);
}
