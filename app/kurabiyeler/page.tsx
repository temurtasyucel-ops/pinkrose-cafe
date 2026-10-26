import type { Metadata } from 'next';
import Storefront from '../storefront';
import { catalog } from '@/db/store';

const title = 'El Yapımı Cookie ve Kurabiye Çeşitleri | Manisa | Pink Rose Cafe';
const description =
  "Manisa'da Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan el yapımı cookie çeşitlerini keşfet. Ücretsiz gel-al, Manisa ve İzmir'e ücretli teslimat.";
const url = 'https://www.pinkrosecafe.com.tr/kurabiyeler';
const socialImage = '/products/gulpembe-dis.webp';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    title,
    description,
    url,
    type: 'website',
    images: [{ url: socialImage, alt: 'Pink Rose el yapımı cookie ve kurabiye çeşitleri' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [socialImage],
  },
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  try {
    return <Storefront page="cookies" initialCatalog={await catalog()} />;
  } catch {
    return <Storefront page="cookies" />;
  }
}
