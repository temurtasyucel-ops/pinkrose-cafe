# Pink Rose Cafe

Next.js uygulaması; GitHub kaynak deposu, Supabase veri/görsel/yönetici girişi ve Vercel yayını için hazırlanmıştır. Kurabiye dış/iç görünüm kaydırmaları, ürün ve paket fiyatları, kampanyalar, sipariş paneli ve Manisa/İzmir adres bazlı teslimat akışı korunur.

## Kurulum

1. Pink Rose için ayrı bir Supabase projesi oluşturun. DOKUNUVER projesine bu şemayı uygulamayın.
2. `supabase/001_initial.sql` dosyasını SQL Editor'da çalıştırın.
3. Supabase Authentication'da yönetici kullanıcısını oluşturun. Kullanıcının UUID'sini `admin_users.user_id` alanına ekleyin. İlk giriş yapan kullanıcıya otomatik yetki verilmez.
4. Vercel'de bu GitHub deposunu Next.js projesi olarak içe aktarın.
5. `.env.example` içindeki üç değeri Vercel ortam değişkenlerine ekleyin. `SUPABASE_SECRET_KEY` sadece sunucuda kullanılmalıdır; tarayıcıya açık değişkenlere eklenmemelidir. Eski projelerde alternatif olarak `SUPABASE_SERVICE_ROLE_KEY` desteklenir.
6. Supabase Auth ayarlarında e-posta/şifre girişini etkinleştirin ve Site URL'yi kurulum tamamlandığında nihai alan adına ayarlayın.
7. Ürün, fiyat, görsel, giriş/çıkış ve deneme siparişi akışını doğruladıktan sonra Vercel'in verdiği gerçek DNS kayıtlarıyla alan adını yönlendirin.

Tablolar RLS ile doğrudan istemci erişimine kapalıdır. Sunucu API'leri yönetici oturumunu ve izin listesini doğrular. Görseller özel Storage bucket'ında saklanır ve uygulamanın görsel API'sinden sunulur. Sipariş tutarı sunucuda hesaplanır; `request_key` aynı isteğin iki kez kaydedilmesini engeller.

İlk katalog isteği mevcut gerçek Pink Rose menüsünü yalnızca eksik kayıtlara ekler. Panelden yapılan değişiklikler sonraki isteklerde üzerine yazılmaz.

## Yerel çalışma

```
npm ci
# .env.example dosyasını .env.local olarak kopyalayıp değerleri doldurun.
npm run dev
```

Node.js 22.13 veya daha güncel bir sürüm gerekir. Doğrulama komutları:

```
node --experimental-strip-types tests/core.mjs
npm run typecheck
npm run build
python tests/migration-smoke.py
```

HTTP testi yerel bir Supabase taklidi kullanır; gerçek sipariş veya hesap oluşturmaz. Canlı hesap ve tarayıcı kontrolleri ayrıca yapılır.

## Geçiş durumu

Bu depo taşıma sürümüdür. Supabase projesi/anahtarları, yönetici kullanıcısı ve Vercel yayını tamamlanmadan canlı bağlantı hazır değildir. Mevcut Sites veritabanındaki son panel değişiklikleri, yüklenen görseller ve sipariş kayıtları gerekiyorsa ayrıca aktarılmalıdır. Depodaki ürün görselleri orijinal site dosyalarından alınmıştır.

Başlangıçta deneme modu açıktır. Panel → Ayarlar → Canlı sipariş taleplerini aç seçeneğini etkinleştirip kaydedin. Canlı talepler panele kaydedilir ve müşteriye WhatsApp onay bağlantısı gösterilir. Çevrim içi ödeme alınmaz. Manisa/İzmir teslimat ücreti adres üzerinden ayrıca onaylanır. Eski deneme siparişleri etiketlenir ve canlı istatistiklere dahil edilmez.

## Sipariş yönetimi

Siparişler başlangıçta Onay bekliyor durumundadır. Panelde müşteri, telefon ve sipariş numarasıyla arayın; durum ve canlı/deneme filtrelerini birlikte kullanın. Detay ekranından müşteriye WhatsApp mesajı hazırlayabilirsiniz. Mesajı göndermek ve siparişi onaylamak ayrı işlemlerdir.

Teslimat siparişinin detayında adrese göre ücreti TL olarak girin. Sunucu toplamı ürün bedeli eksi indirim artı teslimat olarak hesaplar; güncellenen ücret öncekinin yerini alır. Gel-al siparişine ücret eklenemez. Eş zamanlı sipariş değişikliklerinde yenileyip tekrar deneyin.

Ayarlar bölümündeki gel-al adresi, saatleri ve HTTPS harita bağlantısı isteğe bağlıdır. Doldurulan bilgiler vitrinde ve gel-al seçilen sipariş formunda gösterilir.

## Vitrin ve panel davranışı

Sepette yalnızca ürün kimliği ve adetler bu tarayıcıda saklanır; müşteri bilgileri kaydedilmez. Katalog yenilendiğinde satışa kapalı veya tükenen ürünler sepetten çıkarılır. Aynı sipariş isteğini yeniden denemek aynı anahtarı kullanır; form veya sepet değişirse yeni anahtar oluşturulur. Kutu indirimi farklı tekli fiyatları ve tadım setini birlikte dikkate alır.

Sipariş sekmesi görünürken liste 30 saniyede bir yenilenir. Bu yenileme kaydedilmemiş ayar değişikliklerinin üzerine yazmaz. Panel arama motorlarına kapalıdır; ana sayfa için site haritası ve paylaşım bilgileri tanımlıdır.

Ayarlar → Yeni sipariş alımını geçici durdur seçeneği, canlı ve deneme taleplerini sunucuda engeller. Mevcut bir isteğin aynı anahtarla yeniden denenmesi önceki sonucu döndürür. Mola mesajı menü üzerinde gösterilir. Alanların eski kayıtlarda bulunmaması sipariş alımını açık tutar; SQL geçişi gerekmez.

Panelde ürün/kampanya penceresini kapatma, sekme değiştirme, çıkış ve sayfa yenileme sırasında kaydedilmemiş düzenlemeler için uyarı gösterilir. Tarayıcının sayfa kapatma uyarısı kendi standart metnini kullanır.

## Sezonluk ürünler ve paketler

Ürünlerde Kutu paketlerine dahil seçeneği, kimliğine veya menüdeki sıra sayısına bakılmadan kutu hesabına katılımı belirler. Eski yedi üründe bu alan yoksa dahil kabul edilir. Yeni ürün formunda varsayılan açık gelir; farklı ürün gruplarında kapatılabilir.

Tanışma paketinin yedi benzersiz çeşidi Paketler sekmesinden seçilir. Menüye sekizinci veya dokuzuncu ürün eklenmesi bu seçimi ve fiyatı değiştirmez. Seçili bir ürün görünmez, tükenmiş veya kutu dışında ise tanışma paketi alınamaz ve tanışma indirimi uygulanmaz. Yedi çeşitten oluşan tam set ve kalan adetler için uygun kutu kombinasyonu birlikte hesaplanır. Seçim bulunmayan eski kayıtlarda orijinal yedi çeşit kullanılır. SQL geçişi gerekmez.

## Ön sipariş ve ürün bakımı

Varsayılan bilgi: siparişleri teslim tarihinden 2–3 gün önce verin. Ana sayfada ve sipariş formunda gösterilir; tarih/saat tercihi WhatsApp üzerinden kesinleştirilir. Ayarlar bölümünden metni düzenleyebilirsiniz. Genel kurabiye saklama ve ısıtma metinleri de burada bulunur. Üründeki özel metinler genel metinlerin yerine geçer; başka kategorilere kurabiye talimatı otomatik uygulanmaz. Eski ayarlara eksik alanların varsayılanları sunucuda eklenir; kayıtlar ve mevcut düzenlemeler üzerine yazılmaz.

Isıtma metni kısa, kontrollü ılıtma için başlangıç talimatıdır; ürünün gramajı, dolgusu ve fırın davranışıyla kontrol edilmelidir. Başka üreticinin raf ömrü Pink Rose ürünlerine aktarılmamıştır. Krema gibi soğuk saklama gerektiren dolgular için ürünün tarifine uygun özel talimat ve tüketim tarihi kullanılır. Araştırma: https://levainbakery.com/pages/faq ve https://www.fda.gov/food/people-risk-foodborne-illness/holiday-goodies-food-safety-moms-be

Sipariş detayında Sipariş özetini kopyala düğmesi müşteri, ürünler ve tutarları kopyalar. Teslimat ücreti bekleniyorsa toplam açıkça teslimat hariç gösterilir. Tarayıcı panoya izin vermezse seçilebilir metin alanı açılır.
