import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Driver Performance Dashboard",
  description: "Week 3 — Lamina Studios EDA & Analytics",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  );
}
