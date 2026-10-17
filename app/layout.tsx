import type { Metadata } from "next";
import "./globals.css";
import "./storefront-pages.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.pinkrosecafe.com.tr'),
  title: "Pink Rose Cafe | Kurabiye Atölyesi",
  openGraph: {title:'Pink Rose Cafe | Kurabiye Atölyesi',description:'Manisa’dan Pink Rose kurabiyeleri. Gel-al ve Manisa / İzmir teslimatı.',url:'https://www.pinkrosecafe.com.tr',siteName:'Pink Rose Cafe',locale:'tr_TR',type:'website',images:[{url:'/products/gulpembe-dis.webp',alt:'Pink Rose Gülpembe kurabiyesi'}]},
  twitter: {card:'summary_large_image',title:'Pink Rose Cafe',images:['/products/gulpembe-dis.webp']},
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
