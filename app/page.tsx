import type { Metadata } from "next";
import Storefront from "./storefront";
import { catalog } from "@/db/store";

const title = "El Yapımı Cookie ve Kurabiye | Pink Rose Cafe";
const description =
  "Manisa'da Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan Pink Rose kurabiyelerini keşfet. Ücretsiz gel-al ve Manisa / İzmir teslimatı.";
const siteUrl = "https://www.pinkrosecafe.com.tr";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: siteUrl },
  openGraph: {
    title,
    description,
    url: siteUrl,
    type: "website",
    images: [{ url: "/products/gulpembe-dis.webp", alt: "Pink Rose Gülpembe kurabiyesi" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/products/gulpembe-dis.webp"],
  },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  try {
    return <Storefront initialCatalog={await catalog()} />;
  } catch {
    return <Storefront />;
  }
}
