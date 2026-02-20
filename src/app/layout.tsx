import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ReceptionistWidgetLoader } from "@/components/receptionist/receptionist-widget-loader";
import { BrandingProvider } from "@/components/branding-provider";
import { getBranding } from "@/lib/branding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getBranding();
  return {
    title: {
      default: `${branding.name} | ${branding.city} ${branding.province} Renovation Contractor`,
      template: `%s | ${branding.name}`,
    },
    description: `Professional renovation services in ${branding.city}, ${branding.province}. ${branding.tagline}. Kitchen, bathroom, basement, and whole-home renovations with AI-powered project visualization.`,
    keywords: [
      "renovation",
      "contractor",
      `${branding.city} ${branding.province}`,
      "kitchen renovation",
      "bathroom renovation",
      "home improvement",
      branding.name,
    ],
    authors: [{ name: branding.name }],
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: branding.name,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = await getBranding();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrandingProvider initial={branding}>
          <Header />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
          <Footer />
          <ReceptionistWidgetLoader />
        </BrandingProvider>
      </body>
    </html>
  );
}
