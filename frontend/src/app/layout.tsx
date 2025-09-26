
import '../styles/globals.css';
import Providers from '../components/Providers';
import Header from '../components/Header';
import React from 'react';

export const metadata = { title: "Covenant Azor Partner", description: "Azor Agent Dashboard" };

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="wrapper py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
