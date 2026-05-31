import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LakbayLoop",
  description: "Plan. Log. Learn your commute."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
