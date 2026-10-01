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

`npm run typecheck` ve `npm run build` doğrulamaları kullanılabilir. Node.js 22 veya daha güncel bir sürüm gerekir.

## Geçiş durumu

Bu depo taşıma sürümüdür. Supabase projesi/anahtarları, yönetici kullanıcısı ve Vercel yayını tamamlanmadan canlı bağlantı hazır değildir. Mevcut Sites veritabanındaki son panel değişiklikleri, yüklenen görseller ve sipariş kayıtları gerekiyorsa ayrıca aktarılmalıdır. Depodaki ürün görselleri orijinal site dosyalarından alınmıştır.

Siparişler mevcut sürümde deneme modundadır; gerçek ödeme alınmaz. Canlı sipariş açılışı ayrıca yapılmalıdır.
