import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "LOKO Harvest ODS",
  description: "Orders & Delivery Management System for Loko Harvest Limited",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo/loko.png",
  },
};


import { ToastContainer } from "@/components/ui/toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col">
        <Script
          id="error-listener"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                var div = document.getElementById('debug-error-banner');
                if (!div) {
                  div = document.createElement('div');
                  div.id = 'debug-error-banner';
                  div.style.position = 'fixed';
                  div.style.top = '0';
                  div.style.left = '0';
                  div.style.width = '100%';
                  div.style.backgroundColor = 'red';
                  div.style.color = 'white';
                  div.style.padding = '15px';
                  div.style.zIndex = '999999';
                  div.style.fontFamily = 'monospace';
                  div.style.fontSize = '12px';
                  div.style.wordBreak = 'break-all';
                  div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  document.body.appendChild(div);
                }
                div.innerText = 'JS Error: ' + e.message + '\\nAt: ' + e.filename + ':' + e.lineno + ':' + e.colno + '\\nStack:\\n' + (e.error ? e.error.stack : 'No stack trace');
              });
              window.addEventListener('unhandledrejection', function(e) {
                var div = document.getElementById('debug-error-banner');
                if (!div) {
                  div = document.createElement('div');
                  div.id = 'debug-error-banner';
                  div.style.position = 'fixed';
                  div.style.top = '0';
                  div.style.left = '0';
                  div.style.width = '100%';
                  div.style.backgroundColor = 'orange';
                  div.style.color = 'black';
                  div.style.padding = '15px';
                  div.style.zIndex = '999999';
                  div.style.fontFamily = 'monospace';
                  div.style.fontSize = '12px';
                  div.style.wordBreak = 'break-all';
                  div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                  document.body.appendChild(div);
                }
                div.innerText = 'Promise Rejection: ' + e.reason;
              });
            `,
          }}
        />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
