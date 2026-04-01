import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter for premium look
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AIChatbox from "@/components/AIChatbox";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PsychoHealth - Chăm Sóc Sức Khỏe Tâm Lý",
  description: "Hệ thống sàng lọc và tư vấn tâm lý trực tuyến.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <Footer />
          <AIChatbox />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e1b4b',
                color: '#e2e8f0',
                border: '1px solid #4338ca',
                borderRadius: '10px',
                padding: '14px 20px',
                fontSize: '0.9rem',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.25)',
              },
              success: {
                iconTheme: { primary: '#6366f1', secondary: '#1e1b4b' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#1e1b4b' },
              },
            }}
          />
        </div>
      </body>
    </html>
  );
}
