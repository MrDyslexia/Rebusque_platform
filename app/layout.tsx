import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Rebusque — Gestión de Encomiendas",
  description: "Sistema de logística para El Rebusque: órdenes, rutas, conductores y facturación.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider defaultTheme="system">
          {children}
          <Toaster
            position="bottom-right"
            gutter={10}
            containerStyle={{ zIndex: 9999 }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0A0A3E',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '14px',
                fontFamily: 'var(--font-geist-sans), sans-serif',
                padding: '10px 16px',
                boxShadow: '0 4px 24px 0 rgba(0,0,0,0.35)',
                maxWidth: '380px',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#FFFFFF' },
              },
              error: {
                duration: 6000,
                iconTheme: { primary: '#ef4444', secondary: '#FFFFFF' },
              },
              loading: {
                iconTheme: { primary: '#FF0066', secondary: '#FFFFFF' },
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
