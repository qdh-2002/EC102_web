import type { Metadata, Viewport } from "next";
import "./globals.css";
import { COURSE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: `${COURSE.code}: ${COURSE.name} | UCLA`, template: `%s | ${COURSE.code}` },
  description: `Lecture recordings and slides for UCLA ${COURSE.code}: ${COURSE.name}, taught by Prof. Achuta Kadambi.`,
};

export const viewport: Viewport = { themeColor: "#2774AE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
