import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { getCatalog } from "@/lib/cms";
import { absoluteUrl } from "@/lib/format";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "AIVisionary | Công cụ AI cho Content Creator",
    template: "%s | AIVisionary"
  },
  description: "Công cụ AI dành cho creator: voice, transcribe, reup video, review phim và workflow nội dung.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: "AIVisionary",
    description: "Công cụ AI dành cho nhà sáng tạo nội dung.",
    url: absoluteUrl("/"),
    siteName: "AIVisionary",
    locale: "vi_VN",
    type: "website"
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <a href="#main-content" className="skip-link">Bỏ qua đến nội dung chính</a>
          <Suspense fallback={null}>
            <SiteHeader settings={catalog.settings} />
          </Suspense>
          <main id="main-content">{children}</main>
          <SiteFooter settings={catalog.settings} />
          <FloatingActions settings={catalog.settings} />
        </ThemeProvider>
      </body>
    </html>
  );
}
