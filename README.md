# Car Advisor App

AI destekli araç analiz ve araç rehberi mobil uygulaması.

Bu proje, kullanıcıların araç seçimi yaparken daha bilinçli karar verebilmesi için geliştirilmiş bir mobil uygulama MVP’sidir. Uygulama; araç rehberi, ilan analizi ve piyasa araştırması gibi modüller üzerinden kullanıcıya yapay zeka destekli yorumlar üretir.

## Proje Durumu

Proje şu anda MVP / geliştirme aşamasındadır.

Aktif olarak çalışan ana modüller:

- Araç rehberi oluşturma
- Bulunan aracı analiz etme
- AI destekli ilan yorumu
- Piyasa tahmini alanı
- Kilometre, fiyat, hasar ve boya durumuna göre değerlendirme
- Satıcıya sorulacak sorular
- Ekspertizde dikkat edilmesi gereken noktalar
- Rapor geçmişi yapısı

İlerleyen aşamalarda canlı ilan verisi, daha gelişmiş piyasa karşılaştırması, marka/model logoları ve daha kapsamlı araç veri tabanı eklenecektir.

## Kullanılan Teknolojiler

### Mobil Uygulama

- React Native
- Expo
- TypeScript
- Expo Router
- Async/local state yapısı

### Backend

- Node.js
- Express.js
- Gemini API entegrasyonu
- Wikipedia kaynaklı temel araç bilgisi alma
- REST API yapısı

## Ana Özellikler

### 1. Araç Rehberi

Kullanıcı marka, model, yıl, motor, yakıt ve şanzıman bilgilerini girerek araç hakkında genel bir rehber oluşturabilir.

Araç rehberi şunları içerir:

- Genel değerlendirme
- Kronik sorunlar / riskler
- Motor ve şanzıman notları
- Bakım notları
- Ekspertizde özellikle baktırılması gerekenler
- Satıcıya sorulacak sorular
- Kimler için mantıklı?
- Kimler uzak durmalı?
- Son karar

### 2. Bulduğum Aracı Analiz Et

Kullanıcı belirli bir ilan veya araç için detay girerek analiz alabilir.

Girilebilen bilgiler:

- Marka
- Model
- Yıl
- Motor
- Yakıt tipi
- Şanzıman
- Kilometre
- İlan fiyatı
- Hasar durumu
- Boya/değişen bilgisi
- Tramer tutarı
- Satıcı notu

Analiz çıktısı:

- Risk seviyesi
- Özet
- Fiyat / KM / hasar yorumu
- Piyasa tahmini
- Mekanik riskler
- Pazarlık noktaları
- Ekspertizde baktırılacaklar
- Satıcıya sorulacak sorular
- Kimler için mantıklı?
- Kimler uzak durmalı?
- Son karar

### 3. Piyasa Araştırması

Kullanıcı bir araç modeli için genel piyasa araştırması yapabilir.

Bu modülün hedefi:

- KM segmentlerine göre tahmini fiyat aralıkları göstermek
- Temiz, boyalı/değişenli, tramerli ve ağır hasarlı araçlar için ayrı fiyat aralıkları üretmek
- Kullanıcının girdiği kilometre varsa ilgili segmenti öne çıkarmak
- Fiyat girildiyse uygun / normal / pahalı yorumu yapmak

Bu bölüm geliştirme aşamasındadır.

## AI Kullanımı

Projede AI tarafı şu an Gemini API üzerinden çalışmaktadır.

AI şu alanlarda kullanılmaktadır:

- Araç rehberi üretimi
- İlan analizi
- Piyasa tahmini
- Risk yorumu
- Satıcı soruları
- Ekspertiz kontrol listesi
- Pazarlık noktaları

OpenAI entegrasyonu için altyapı ileride tekrar aktif edilebilecek şekilde düşünülmüştür.

## Veri Kaynakları

Şu an kullanılan veri kaynakları:

- Kullanıcı tarafından girilen araç bilgileri
- Wikipedia üzerinden alınan genel araç/model bilgisi
- AI tarafından üretilen yorum ve tahminler

Not: Piyasa fiyatları şu aşamada canlı ilan sitelerinden çekilmemektedir. AI destekli tahmini piyasa yorumudur. Canlı ilan verisi entegrasyonu ilerleyen aşamada eklenecektir.

## Kurulum

Projeyi çalıştırmak için önce bağımlılıkları yükleyin.

```bash
npm install