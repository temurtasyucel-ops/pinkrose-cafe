import type { Metadata } from 'next';
import { ArrowUpRight, Camera, Heart, Home, MessageCircle } from 'lucide-react';
import styles from './links.module.css';

const description = 'Pink Rose Cafe ana sayfası, Instagram hesabı ve WhatsApp sipariş hattı tek yerde.';
export const metadata: Metadata = {
  title: 'Pink Rose Cafe | Tüm Bağlantılar',
  description,
  alternates: { canonical: 'https://www.pinkrosecafe.com.tr/linkler' },
  openGraph: { title: 'Pink Rose Cafe | Tüm Bağlantılar', description, url: 'https://www.pinkrosecafe.com.tr/linkler' },
};

const links = [
  { name: 'Ana Sayfa', detail: 'Kurabiyelerimizi keşfet', href: '/', icon: Home },
  { name: 'Instagram', detail: '@pinkrosecafe.tr', href: 'https://www.instagram.com/pinkrosecafe.tr/', icon: Camera },
  { name: 'WhatsApp', detail: 'Sipariş ve bilgi için bize yaz', href: 'https://wa.me/905060584705', icon: MessageCircle },
];

export default function LinksPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="links-title">
        <div className={styles.emblem} aria-hidden="true"><Heart size={30} strokeWidth={1.5} /></div>
        <header className={styles.header}>
          <h1 id="links-title">Pink Rose</h1>
          <span className={styles.cafe}>CAFE</span>
          <p>Küçük bir mola. Kocaman bir mutluluk.</p>
        </header>
        <nav className={styles.links} aria-label="Pink Rose bağlantıları">
          {links.map(({ name, detail, href, icon: Icon }) => (
            <a className={styles.link} key={name} href={href}>
              <span className={styles.icon} aria-hidden="true"><Icon size={25} strokeWidth={1.7} /></span>
              <span className={styles.label}><strong>{name}</strong><span>{detail}</span></span>
              <ArrowUpRight className={styles.arrow} size={21} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <footer className={styles.footer}>Manisa’dan, sevgiyle.<br /><span>pinkrosecafe.com.tr</span></footer>
      </section>
    </main>
  );
}
