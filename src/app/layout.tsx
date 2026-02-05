import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AI Reno Demo | Ontario Renovation Contractor",
    template: "%s | AI Reno Demo",
  },
  description:
    "Professional renovation services in Greater Ontario Area. Kitchen, bathroom, and whole-home renovations with AI-powered project visualization.",
  keywords: [
    "renovation",
    "contractor",
    "Greater Ontario Area",
    "Ontario",
    "kitchen renovation",
    "bathroom renovation",
    "home improvement",
  ],
  authors: [{ name: "AI Reno Demo" }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "AI Reno Demo",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
