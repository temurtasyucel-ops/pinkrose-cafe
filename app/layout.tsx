import type { Metadata } from "next";
import "./globals.css";
import "./storefront-pages.css";
import "./mobile-storefront.css";

const siteUrl = "https://www.pinkrosecafe.com.tr";
const siteTitle = "Pink Rose Cafe | Manisa El Yapımı Cookie ve Kurabiye";
const siteDescription =
  "Manisa'da Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan el yapımı cookie ve kurabiyeler. Gel-al ücretsiz, Manisa ve İzmir'e ücretli teslimat.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: "Pink Rose Cafe",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/products/gulpembe-dis.webp",
        alt: "Pink Rose Gülpembe el yapımı kurabiyesi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/products/gulpembe-dis.webp"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "Pink Rose Cafe",
  url: siteUrl,
  image: `${siteUrl}/products/gulpembe-dis.webp`,
  description: siteDescription,
  telephone: "+905060584705",
  priceRange: "₺₺",
  servesCuisine: ["Cookie", "Kurabiye"],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Manisa",
    addressRegion: "Manisa",
    addressCountry: "TR",
  },
  areaServed: [
    { "@type": "City", name: "Manisa" },
    { "@type": "City", name: "İzmir" },
  ],
  sameAs: ["https://www.instagram.com/pinkrosecafe.tr/"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
