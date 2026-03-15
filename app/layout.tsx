import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { AIAssistantDrawer } from "@/components/layout/AIAssistantDrawer";
import { AITriggerButton } from "@/components/layout/AITriggerButton";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { organizationSchema, websiteSchema } from "@/lib/seo/schemas";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Apex Archery | Premium Archery Gear",
    template: "%s | Apex Archery",
  },
  description:
    "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
  openGraph: {
    type: "website",
    siteName: "Apex Archery",
    title: "Apex Archery | Premium Archery Gear",
    description:
      "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Archery | Premium Archery Gear",
    description:
      "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SchemaOrg data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL)]} />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthProvider>
          <PostHogProvider>
            <div className="hidden lg:block">
              <Header />
            </div>
            <MobileHeader />
            <main className="flex-1 lg:pt-0 pt-16 pb-16 lg:pb-0">{children}</main>
            <Footer />
            <CartDrawer />
            <AIAssistantDrawer />
            <AITriggerButton />
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
