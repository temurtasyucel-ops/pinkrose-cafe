import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pink Rose Cafe | Kurabiye Atölyesi",
  description: "Manisa’da ev mutfağından başlayan Pink Rose Cafe kurabiye hikâyesi.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
