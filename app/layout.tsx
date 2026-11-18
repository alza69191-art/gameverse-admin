import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GameVerse Admin",
  description: "إدارة الألعاب والمطورين والمستخدمين وطلبات النشر من مساحة تشغيل واحدة.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>;
}
