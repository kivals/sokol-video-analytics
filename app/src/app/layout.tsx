import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ToastProvider } from "@/components/Toasts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "СОКОЛ — платформа видеоаналитики",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full grid grid-cols-[240px_1fr] grid-rows-[auto_1fr]">
        <ToastProvider>
          <Sidebar />
          <Header />
          <main className="col-start-2 row-start-2 overflow-auto">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
