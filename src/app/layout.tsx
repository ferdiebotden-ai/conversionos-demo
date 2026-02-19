import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReceptionistWidgetLoader } from "@/components/receptionist/receptionist-widget-loader";
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
    default: "McCarty Squared Inc. | London ON Renovation Contractor",
    template: "%s | McCarty Squared Inc.",
  },
  description:
    "Professional renovation services in London, ON. Dream. Plan. Build. Kitchen, bathroom, net-zero, heritage restoration, and whole-home renovations with AI-powered project visualization.",
  keywords: [
    "renovation",
    "contractor",
    "London Ontario",
    "kitchen renovation",
    "bathroom renovation",
    "home improvement",
    "net zero homes",
    "heritage restoration",
    "accessibility modifications",
    "McCarty Squared",
  ],
  authors: [{ name: "McCarty Squared Inc." }],
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "McCarty Squared Inc.",
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
        <ReceptionistWidgetLoader />
      </body>
    </html>
  );
}
