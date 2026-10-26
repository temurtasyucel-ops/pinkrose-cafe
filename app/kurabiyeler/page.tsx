import type { Metadata } from 'next';
import Storefront from '../storefront';
import { catalog } from '@/db/store';

const title = 'El Yapımı Cookie ve Kurabiye Çeşitleri | Manisa | Pink Rose Cafe';
const description =
  "Manisa'da Callebaut Belçika çikolatası ve %100 yayık tereyağıyla hazırlanan el yapımı cookie çeşitlerini keşfet. Ücretsiz gel-al.";
const url = 'https://www.pinkrosecafe.com.tr/kurabiyeler';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { title, description, url, type: 'website' },
  twitter: { card: 'summary', title, description },
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  try {
    return <Storefront page="cookies" initialCatalog={await catalog()} />;
  } catch {
    return <Storefront page="cookies" />;
  }
}
