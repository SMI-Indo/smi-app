import type { Metadata } from "next";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";
import { liturgyQuizEnabled } from "@/lib/featureFlags";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Sahabat Misdinar Indonesia",
    default: "Sahabat Misdinar Indonesia — Platform Digital Misdinar Katolik",
  },
  description:
    "Platform digital terpusat untuk komunitas Putra-Putri Altar (Misdinar) di seluruh Indonesia. Fasilitasi administrasi liturgi, pembelajaran, manajemen keanggotaan, dan sistem apresiasi berbasis gamifikasi.",
  keywords: [
    "misdinar",
    "putra putri altar",
    "katolik",
    "gereja",
    "liturgi",
    "indonesia",
  ],
  authors: [{ name: "Sahabat Misdinar Indonesia" }],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Sahabat Misdinar Indonesia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-background text-on-background font-sans antialiased min-h-screen flex flex-col">
        <Providers>
          <Navbar showQuiz={liturgyQuizEnabled} />
          <div className="flex-grow">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
