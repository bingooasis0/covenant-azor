
import '../styles/globals.css';
import React from 'react';
import Sidebar from '../components/Sidebar';

export const metadata = { title:"Covenant Azor", description:"Partner Portal" };

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Sidebar />
          <div className="content">{children}</div>
        </div>
      </body>
    </html>
  );
}
