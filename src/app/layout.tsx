import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalakbay",
  description: "Your daily commute companion.",
  icons: {
    icon: "/kalakbay_logo.png",
    shortcut: "/kalakbay_logo.png",
    apple: "/kalakbay_logo.png"
  }
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
