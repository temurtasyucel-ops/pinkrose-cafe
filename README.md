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
npm run test:env
npm run typecheck
npm run build
python tests/migration-smoke.py
```

HTTP testi yerel bir Supabase taklidi kullanır; gerçek sipariş veya hesap oluşturmaz. Canlı hesap ve tarayıcı kontrolleri ayrıca yapılır.

## Üretim işletimi: limitler, sağlık kontrolü, geri alma ve yedek

### Rate limiting ve ortam değişkenleri

- <code>POST /api/auth/login</code> dakikada IP başına 15; <code>POST /api/inquiries</code> 4; <code>POST /api/orders</code> 10; <code>POST /api/order-status</code> 40 istekle sınırlandırılır. Limitler Supabase'teki <code>consume_rate_limit</code> RPC'si üzerinden paylaşılır; rate-limit altyapısı hata verirse istekler güvenlik için reddedilir, limit atlanmaz.
- <code>GET /api/health</code> uygulamanın Supabase REST API'si üzerinden <code>records</code> tablosuna erişebildiğini doğrular. Başarıda yalnızca <code>{"status":"ok"}</code> döner; başarısızlıkta genel 503 yanıtı ve loglarda eşleştirilebilir <code>PRERR-…</code> referansı döner. İzleme servisiyle 1–5 dakikada bir kontrol etmek yeterlidir; bu uç nokta her çağrıda veritabanına sorgu gönderir.
- <code>lib/env.ts</code> Supabase URL'sini ve gerekli anahtarları kullanım anında doğrular. URL HTTPS olmalı; HTTP yalnızca localhost geliştirme/test ortamında kabul edilir. <code>SUPABASE_SECRET_KEY</code> (veya eski <code>SUPABASE_SERVICE_ROLE_KEY</code>) yalnızca sunucuda tutulmalıdır; hiçbir gizli anahtarı <code>NEXT_PUBLIC_</code> ile tanımlamayın.
- Ortam değişkenlerini kontrol etmek için <code>npm run test:env</code> komutu kullanılabilir. Bu test gerçek Supabase hesabına bağlanmaz.

### Connection pool ve sağlık kontrolü

Uygulama <code>@supabase/supabase-js</code> ile Supabase'in HTTPS REST API'sini kullanır; uygulama doğrudan PostgreSQL TCP bağlantısı açmadığından Next.js tarafında klasik bir connection pool yapılandırması yoktur. Supabase'in API/veritabanı katmanı bağlantıları kendi tarafında yönetir. İleride doğrudan PostgreSQL sürücüsü eklenirse Supabase'in connection pooler seçeneği ayrıca değerlendirilmelidir.

### Vercel geri alma

1. Vercel projesinde **Deployments** bölümünü açın.
2. Sorunlu dağıtımdan önceki, bilinen sağlam **Ready** dağıtımını seçip **Promote/Rollback** işlemiyle tekrar canlıya alın (arayüzdeki ad değişebilir).
3. <code>/api/health</code> ve vitrin sayfalarını kontrol edin; mümkünse deneme sipariş akışını da doğrulayın.
4. Geri alma yalnızca uygulama kodunu/dağıtımını geri alır. Supabase verilerini, fiyatları, siparişleri veya Storage dosyalarını otomatik olarak geri almaz. Veritabanı değişiklikleri ayrı bir geri dönüş planı gerektirir.

### Supabase yedekleme — yapılması gereken manuel işlem

Bu Supabase projesi Free planda. Supabase dokümantasyonuna göre günlük otomatik veritabanı yedekleri Pro, Team ve Enterprise planlarında sunulur; Free projeler düzenli dışa aktarma ve site dışı yedek tutmalıdır. **Bu depoda otomatik yedekleme görevi veya doğrulanmış bir geri yükleme kopyası yoktur.**

Bir yönetici bilgisayarında Supabase CLI kurulu ve <code>SUPABASE_DB_URL</code> güvenli şekilde tanımlı olduktan sonra veritabanı mantıksal yedeği şu şekilde alınabilir:

<pre><code>mkdir -p "$HOME/pinkrose-backups"
supabase db dump --db-url "$SUPABASE_DB_URL" -f "$HOME/pinkrose-backups/pinkrose-$(date +%F).sql"</code></pre>

Yedek dosyasını Git deposuna veya herkese açık bir yere koymayın; şifreli ve site dışı bir konumda saklayın. Supabase Storage'daki <code>product-images</code> nesneleri veritabanı dökümünün içine girmez; bunları ayrıca dışa aktarıp aynı yedekleme düzenine dahil edin. Düzenli aralıklarla yedekten geri yükleme testi yapın. Yedek alma ve geri yükleme henüz bu işlem sırasında çalıştırılmadı; yalnızca prosedür belgelendi.

Kaynaklar: Supabase [Database Backups](https://supabase.com/docs/guides/platform/backups), [CLI db dump](https://supabase.com/docs/reference/cli/supabase-db-dump).

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

Kutuya dahil ürünlerde panelden değiştirilen başlangıç adedi ve indirimli birim fiyat kullanılır (varsayılan: 2 adet ve üzeri, birim 150 TL). Tekli ürün fiyatları ürün kaydından gelir; indirim bir ürünü kendi fiyatından pahalı yapmaz. Kutu dışında kalan ürünler eşiğe dahil değildir. Kutu kartlarının fiyatları otomatik türetilir. Eski paket kayıtları ilk katalog okumasında bu varsayılanla güncellenir; sonraki ayarlar korunur. Önceden kaydedilen sipariş tutarları değişmez.

## Ön sipariş ve ürün bakımı

Varsayılan bilgi: siparişleri teslim tarihinden 2–3 gün önce verin. Ana sayfada ve sipariş formunda gösterilir; tarih/saat tercihi WhatsApp üzerinden kesinleştirilir. Ayarlar bölümünden metni düzenleyebilirsiniz. Genel kurabiye saklama ve ısıtma metinleri de burada bulunur. Üründeki özel metinler genel metinlerin yerine geçer; başka kategorilere kurabiye talimatı otomatik uygulanmaz. Eski ayarlara eksik alanların varsayılanları sunucuda eklenir; kayıtlar ve mevcut düzenlemeler üzerine yazılmaz.

Isıtma metni kısa, kontrollü ılıtma için başlangıç talimatıdır; ürünün gramajı, dolgusu ve fırın davranışıyla kontrol edilmelidir. Başka üreticinin raf ömrü Pink Rose ürünlerine aktarılmamıştır. Krema gibi soğuk saklama gerektiren dolgular için ürünün tarifine uygun özel talimat ve tüketim tarihi kullanılır. Araştırma: https://levainbakery.com/pages/faq ve https://www.fda.gov/food/people-risk-foodborne-illness/holiday-goodies-food-safety-moms-be

Sipariş detayında Sipariş özetini kopyala düğmesi müşteri, ürünler ve tutarları kopyalar. Teslimat ücreti bekleniyorsa toplam açıkça teslimat hariç gösterilir. Tarayıcı panoya izin vermezse seçilebilir metin alanı açılır.

## Havale/EFT ile ödeme

Canlı akış: Onay bekliyor → WhatsApp üzerinden ürünler, teslim zamanı ve teslimat dahil kesin tutar netleştirilir → IBAN bilgileri gönderilir → Ödeme bekleniyor → hesap hareketinden ödeme doğrulanır → Ödeme alındı → Hazırlanıyor → Teslim edildi. Onaylandı eski kayıtlarla uyumluluk için tutulur; ödeme doğrulaması anlamına gelmez. Banka entegrasyonu ve otomatik ödeme kontrolü yoktur. Yönetici durumları elle günceller. Dekont veya WhatsApp mesajı otomatik ödeme onayı üretmez. Hesap bilgileri siteye eklenmemiştir; işletme WhatsApp üzerinden paylaşır. Sipariş numarası havale açıklaması olarak istenir. Genel talimat Ayarlar bölümünden düzenlenir.

Müşterinin WhatsApp onay bağlantısı kaydedilmiş siparişin sunucuda oluşturulan tam özetini içerir: müşteri ve telefon, ürünler/adetler, teslimat türü/şehir/adres, tarih/saat tercihi, not, ara toplam, indirim, teslimat ücreti veya bekleme bilgisi ve toplam. Aynı isteğin tekrarında önceki kaydın mesajı döner; tarayıcıdaki sonradan değiştirilmiş formdan oluşturulmaz. Mesajı müşteri WhatsApp üzerinden kendisi gönderir.

Ödeme bilgileri bağlantısı varsayılan olarak https://dokunuver.com.tr/i/6FU5V2 adresidir; Ayarlar bölümünden değiştirilebilir. Sipariş detayındaki Ödeme bilgilerini gönder, müşteriye kesin toplam ve link içeren WhatsApp taslağı açar. Teslimat bedeli beklerken veya değiştirilmiş bedel henüz kaydedilmemişken düğme kapalıdır. Deneme, ödeme alınmış, hazırlanan, teslim edilmiş veya iptal siparişlerinde yeni ödeme mesajı oluşturulmaz. Mesaj açmak durumu değiştirmez ve otomatik göndermez. Tarih/saat alanı müşteri tercihi olarak etiketlenir; göndermeden önce anlaşılmış tarihi kontrol edin.


### Storefront experience (October 2026)

The home page reads the current catalog on the server and refreshes it on the client. Existing panel prices and product names remain authoritative. Box selection uses the same quantity-pricing rules as checkout.

Product editing includes short flavour notes, a new-product badge and an optional last order date (inclusive, Europe/Istanbul). Expired dates prevent new orders server-side; clear the date to reopen. No photos or nutritional values are invented.

Gift recipient details and card messages are stored with orders and included in customer WhatsApp summaries. Group/event enquiries use a separate form and private panel list; they do not create confirmed orders or reserve production capacity.

The panel's customer experience tab manages reviews and anonymous action counts. Publishing a review requires a delivered non-demo order and confirmed customer permission. Only display name, text, rating and an opaque review ID are public. Customer and order details stay private. Empty reviews are not shown.

Interaction records contain only action, optional product ID, quantity and Istanbul date. They do not store customer information, visitor IDs or cookies. Do Not Track is respected. Counts are events, not unique people or confirmed sales. The panel displays at most 5,000 events from the last 30 calendar days; sampling cleanup removes interaction records older than 35 days. Real order records are never removed by this cleanup.

New records use the existing private `records` table with `review`, `inquiry` and `insight` kinds; no SQL migration is required. Public catalog reads are scoped to catalog kinds and explicitly projected published reviews.

### Shopping pages

The public shop uses `/kurabiyeler`, `/kutunu-olustur`, `/kutlama-etkinlik`, `/hikayemiz` and `/kurabiyeler/[slug]`. Every page reads the same catalog, prices, availability, reviews and quantity policy. Product links have stable slugs for the original nine recipes; renamed new products retain ID-based alias resolution and redirect to their canonical address. Inactive products return 404 and leave the dynamic sitemap. Product share metadata uses the current panel name, description and photo.

The homepage shows up to three active featured products in panel order, filling remaining slots from active products. It does not claim these are best sellers. Full product descriptions, ingredients, allergens and care remain on product pages. Taste filters use recipe text and do not assert allergy suitability. The event page reuses the private inquiry API and existing statuses; choosing an occasion preselects that field without creating an order or reserving a date.

The desktop/mobile navigation links to the same pages. The basket continues using `pinkrose-cart-v1` across page changes, with storage-event synchronization between tabs. Prices are recalculated from the current catalog and checked again by the order API. All new pages support the existing Turkish/English preference. Photo/video additions remain deferred.


## Order calendar and private tracking

Box cards calculate their total and unit-price range from current eligible products and the bulk threshold, preserving cheaper prices. An additional campaign discount remains a basket calculation. Product and box pages show the first suitable Istanbul date. Checkout offers dates within the next year and filters closed/full days for the basket's eligible-cookie quantity; time remains optional and is confirmed on WhatsApp.

The panel's **Takvim & Kapasite** tab manages closed dates and a daily eligible-cookie limit. `0` means unlimited; no business capacity is invented at deployment. Pending live requests reserve places, cancelled orders release them, and confirmed schedule changes transfer the reservation. Demo orders and separate group enquiries do not consume capacity. Closed dates/limits do not cancel existing orders. Older undated orders need a confirmed schedule before they can be counted.

The private `records` entry `order-calendar` stores configuration and bookings. Optimistic JSON compare-and-swap serializes admissions across instances. A reschedule holds both days until the order update is complete; duplicate holds for the same order/day count once. An uncertain persistence error keeps the slot, favoring underbooking over overbooking. Retrying uses the same request key. The panel's reconciliation action reads all paginated orders, retaining holds younger than 15 minutes (API runtime is at most 60 seconds). No SQL migration is required. Public catalog responses project date totals only, never reservation keys or order IDs.

New orders receive a random private tracking credential. `/siparis/[token]` loads an allowlisted summary through rate-limited, same-origin `POST /api/order-status` and refreshes every 30 seconds while visible. Names, phones, addresses, gift notes, internal history, request keys and credentials are excluded. Tracking pages send no-store, no-referrer and noindex headers, are excluded from the sitemap and disallowed in robots. WhatsApp drafts and the order success screen contain the link. Administrators can create a link for an older order in its detail dialog; no message is sent automatically.

Validation: `node --experimental-strip-types tests/order-calendar.mjs` covers price ranges, date/capacity limits and projection privacy. `python3 tests/migration-smoke.py` uses an isolated fake Supabase, including authenticated admin calls, concurrent last-slot admissions, retries, cancellation/reopening, rescheduling, stale calendar updates, private tracking and indexing controls. It creates no production orders.

## Compact phone storefront

`app/mobile-storefront.css` contains phone-only overrides, imported after the base styles. Homepage previews use a single column of photo/text rows, avoiding an orphan third tile. Full catalog cards remain two columns. Product names precede nutrition; ingredients, natural 4:5 photos, filling swipe controls and add actions remain available. The phone offer strip omits its duplicate box link; navigation and the fixed quick-order bar still provide it. Header, footer, shortcuts and quick-order spacing are reduced while interactive controls retain 44px heights. The changes were guided by supplied iPhone screenshots; physical-device validation remains separate from desktop browser QA.

## Repeat boxes, early gifts and order stages

### Basket changes and daily operations

The cart keeps a public pricing snapshot (product IDs/names/prices, quantity rule, campaign rate and delivery/mode conditions) beside its ID/quantity storage; it contains no customer or recipient fields. Opening the basket, returning to a visible tab, the visible minute interval and order preflight refresh the catalog. Closed/missing/expired items are removed with a notice, remaining choices are preserved and price/terms changes require review. Notices persist in session storage until acknowledged. A `quote` fingerprint is checked again by the order API before booking/inserting; older clients remain compatible. Quote changes are excluded from retry identity, and an already saved request key still wins over changed pricing.

The panel opens on **Günlük işler**, using the existing last 500 order records. Counts cover pending confirmation/payment, today's/tomorrow's confirmed dates, earlier delivery days and paid orders without a date. Demo/cancelled/delivered orders are excluded as appropriate. Dates use Europe/Istanbul; customer preferences are not promoted to confirmed dates. The overview refreshes every 30 seconds while visible and opens the existing order detail dialog.

### Failure references

Order, upload, catalog and admin failures return an opaque `PRERR-…` reference. `readJson` includes it in the user-visible error. Server runtime logs use a structured `operation_failed` event with scope, stage, HTTP status, safe error type/code and the same reference. Raw exceptions, request bodies, customer fields, request keys, tracking credentials and filenames are not logged by these paths. Database/calendar/rate-limit failures are wrapped before reaching the routes. In Vercel runtime logs, search the reference to locate the failing stage; retention follows the hosting plan. This adds correlation, not a separate monitoring service or outbound alerts. Tests use isolated fake database/storage services and create no production orders or files.

Published customer reviews are no longer limited to three records. The homepage uses the installed Embla carousel with three visible desktop cards and an 87%-width phone card so the next review is visible. Manual arrows, position dots, swipe/drag and keyboard arrows/Home/End share the same positions; there is no autoplay or looping. Controls disappear when all reviews fit, and reduced-motion preferences disable animated scrolling. Review content and publication/consent rules are unchanged.

Basket lines show the quantity-adjusted unit price and line total from the same calculation used by `priceBasket`; cheaper products are never increased. Campaign discounts remain separate at the total. Customers explicitly choose collection or delivery before opening the form; no delivery fee is assumed before selection. Checkout folds the full editable basket into a closed summary so contact/date fields appear sooner, while details remain accessible without unmounting the form. Increment controls also respect pauses and current product availability.

Product cards and product detail share the current basket quantity through inline add/remove controls, with a 50-per-product ceiling and unavailable/paused increment protection. Adding does not force the basket open. The basket sums the actual selected eligible-cookie weight ranges; drinks and packaging are excluded, and unknown selected cookie weights suppress the estimate. After a live request is saved, the success screen explains WhatsApp confirmation, bank-transfer verification and preparation alongside the existing private tracking link. Demo success does not show live payment instructions. No payment is collected online.

The box builder remembers only the latest product IDs and quantities on the same device (`pinkrose-previous-box-v1`). Repeat opens a review dialog after refreshing the catalog; current availability, box sizes and prices apply, and missing varieties require replacements. It never submits an order automatically. Customers can forget the saved selection. Gift mode can be selected on the box page and persists in the same tab until the order is completed; recipient details remain in the order form.

The experience panel reports anonymous checkout opens/exits separately from live order records and payment-verified statuses/history. These are event counts, not unique visitors or a linked conversion funnel. Cancelled orders are excluded from the current paid total. Existing order-history and record storage are reused; no migration is needed.
