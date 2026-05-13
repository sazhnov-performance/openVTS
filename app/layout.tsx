import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "openVTS",
  description: "Manage Redis-stored tables via API and UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
