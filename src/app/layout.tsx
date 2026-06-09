import "@fontsource/rokkitt/400.css";
import "@fontsource/rokkitt/700.css";
import "@fontsource/rokkitt/800.css";
import "@fontsource/gelasio/400.css";
import "@fontsource/gelasio/400-italic.css";
import "@fontsource/gelasio/700.css";
import "@fontsource/inconsolata/400.css";
import "@fontsource/inconsolata/700.css";
import "@fontsource/patrick-hand/400.css";
import "./globals.css";

import type { Metadata, Viewport } from "next";
import PrintDefs from "@/components/art/PrintDefs";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "Stash — point at your pile. Watch it sell.",
  description:
    "Turn your stash into cash. Point your phone at a pile of stuff; a little shopkeeper identifies it, prices it, lists it, and haggles with buyers for you — you just nod.",
  applicationName: "Stash",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icon-192.png", sizes: "192x192" }],
    apple: [{ url: "/icon-192.png" }],
  },
  appleWebApp: { capable: true, title: "Stash", statusBarStyle: "default" },
  openGraph: {
    title: "Stash — point at your pile. Watch it sell.",
    description: "A real, shareable shop, run by a squirrel. Every closet is a shop that never opened.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5F3EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrintDefs />
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
