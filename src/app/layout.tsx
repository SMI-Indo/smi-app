import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Work_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${workSans.variable}`}
    >
      <head>
        {/* Material Symbols Outlined — icon library */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="bg-background text-on-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
