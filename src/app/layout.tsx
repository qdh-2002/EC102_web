import type { Metadata, Viewport } from "next";
import "./globals.css";
import { COURSE } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: `${COURSE.code}: ${COURSE.name} | UCLA`, template: `%s | ${COURSE.code}` },
  description: `Lecture recordings, slides, discussion materials, homework and exam preparation for UCLA ${COURSE.code}: ${COURSE.name}.`,
};

export const viewport: Viewport = { themeColor: "#2774AE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
