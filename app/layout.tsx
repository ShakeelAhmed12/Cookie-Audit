import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cookie Audit",
  description: "A tool to audit cookies on a website and produce a report of the cookies found.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-screen bg-cyan-500 bg-gradient-to-r from-cyan-500 to-blue-500">{children}</body>
    </html>
  );
}
