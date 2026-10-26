import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { cache } from 'react';
import Storefront from '../../storefront';
import { catalog } from '@/db/store';
import { findProduct, productPath, productSlug, siteOrigin } from '@/lib/storefront-pages';
import { productAvailable } from '@/lib/shop-experience';

const readCatalog = cache(catalog);
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ slug: string }> };

function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await readCatalog();
  const p = findProduct(c.products, slug);

  if (!p) return { title: 'Ürün bulunamadı | Pink Rose Cafe', robots: { index: false, follow: true } };

  const title = `${p.name} Cookie | Manisa El Yapımı Kurabiye | Pink Rose Cafe`;
  const firstDescription = p.description.split(/[.!?]/)[0]?.trim() || p.description;
  const description = `${p.name} cookie: ${firstDescription}. Callebaut Belçika çikolatası ve %100 yayık tereyağıyla Manisa'da hazırlanır.`;
  const url = siteOrigin + productPath(p);
  const images = p.image ? [{ url: p.image, alt: `${p.name} el yapımı cookie` }] : [];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', images },
    twitter: { card: 'summary_large_image', title, description, images: p.image ? [p.image] : [] },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const c = await readCatalog();
  const p = findProduct(c.products, slug);

  if (!p) notFound();
  if (slug !== productSlug(p)) permanentRedirect(productPath(p));

  const productUrl = siteOrigin + productPath(p);
  const images = [p.image, p.insideImage]
    .filter((image): image is string => Boolean(image))
    .map(image => new URL(image, siteOrigin).toString());

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    ...(images.length ? { image: images } : {}),
    sku: p.id,
    category: p.category,
    brand: { '@type': 'Brand', name: 'Pink Rose Cafe' },
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'TRY',
      price: (p.price / 100).toFixed(2),
      ...(!c.settings.ordersPaused
        ? { availability: productAvailable(p) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }
        : {}),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: siteOrigin },
      { '@type': 'ListItem', position: 2, name: 'Kurabiyelerimiz', item: siteOrigin + '/kurabiyeler' },
      { '@type': 'ListItem', position: 3, name: p.name, item: productUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }} />
      <Storefront page="product" productId={p.id} initialCatalog={c} />
    </>
  );
}
