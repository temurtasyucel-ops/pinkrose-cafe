'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="message"><h1>Kısa bir aksaklık oldu.</h1><p>Sayfayı yeniden yüklemeyi deneyebilirsiniz.</p><button className="button" onClick={reset}>Tekrar dene</button> <a href="/" className="text-link">Ana sayfaya dön</a></main>;}
