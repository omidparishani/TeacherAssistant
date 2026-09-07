import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "دستیار هوشمند معلم پایه سوم",
  description: "سامانه هوشمند تحلیل کتاب‌های درسی و تولید راهنمای تدریس برای معلمان پایه سوم ابتدایی",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="min-h-screen bg-slate-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
