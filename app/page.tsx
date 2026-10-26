import type { Metadata } from "next";
import Storefront from "./storefront";
import { catalog } from "@/db/store";

const title = "Manisa'da El Yapımı Cookie ve Kurabiye | Pink Rose Cafe";
const description =
  "Manisa'da Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan el yapımı cookie çeşitlerini keşfet. Ücretsiz gel-al, Manisa ve İzmir'e ücretli teslimat.";
const siteUrl = "https://www.pinkrosecafe.com.tr";
const socialImage = "/products/gulpembe-dis.webp";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: siteUrl },
  openGraph: {
    title,
    description,
    url: siteUrl,
    type: "website",
    images: [{ url: socialImage, alt: "Pink Rose Gülpembe el yapımı kurabiyesi" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
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
