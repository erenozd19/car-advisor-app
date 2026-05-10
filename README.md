# Car Advisor App

AI destekli araç analiz ve araç rehberi mobil uygulaması.

Bu proje, araç satın almak isteyen kullanıcıların daha bilinçli karar verebilmesi için geliştirilmiş MVP seviyesinde bir mobil uygulamadır.

Uygulama; araç rehberi, ilan analizi ve piyasa araştırması modülleriyle kullanıcıya araç hakkında AI destekli yorum, risk analizi, tahmini piyasa aralığı, ekspertiz kontrol listesi ve satıcıya sorulacak sorular üretir.

---

## Proje Durumu

Proje şu anda geliştirme / MVP aşamasındadır.

Çalışan ana akışlar:

- Araç Rehberi Gör
- Bulduğum Aracı Analiz Et
- Piyasa Araştırması Yap
- AI destekli fiyat / kilometre / hasar yorumu
- Piyasa tahmini kartı
- Ekspertiz kontrol listesi
- Satıcıya sorulacak sorular
- Rapor geçmişi

---

## Kullanılan Teknolojiler

### Mobil Uygulama

- React Native
- Expo
- TypeScript
- Expo Router

### Backend

- Node.js
- Express.js
- Gemini API
- Wikipedia API

---

## Projeyi Bilgisayara İndirme

```bash
git clone https://github.com/erenozd19/car-advisor-app.git
cd car-advisor-app
```

---

## Kurulum

Ana uygulama bağımlılıklarını yükleyin:

```bash
npm install
```

Backend klasörüne girip backend bağımlılıklarını yükleyin:

```bash
cd backend
npm install
```

---

## Environment Ayarı

Backend klasörü içinde `.env.example` dosyasını kopyalayıp `.env` dosyası oluşturun.

Windows:

```bash
copy .env.example .env
```

Mac / Linux:

```bash
cp .env.example .env
```

`.env` dosyası şu formatta olmalıdır:

```env
PORT=3001

AI_PROVIDER=gemini

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
```

Gerçek Gemini API key `.env` dosyasına yazılmalıdır.

`.env` dosyası güvenlik nedeniyle GitHub’a gönderilmemelidir.

---

## Backend Nasıl Açılır?

Terminalde backend klasörüne girin:

```bash
cd backend
```

Backend’i başlatın:

```bash
npm run dev
```

Başarılı çalışırsa terminalde şu tarz bir çıktı görülür:

```txt
Backend çalışıyor: http://localhost:3001
```

Backend açık kalmalıdır. Mobil uygulama AI raporlarını backend üzerinden alır.

---

## Mobil Uygulama Nasıl Açılır?

Yeni bir terminal açın.

Proje ana klasörüne girin:

```bash
cd car-advisor-app
```

Expo uygulamasını başlatın:

```bash
npx expo start -c
```

Terminalde QR kod oluşur.

Telefonda Expo Go uygulaması açılır ve QR kod okutulur.

Telefon ve bilgisayar aynı Wi-Fi ağına bağlı olmalıdır.

---

## API Base URL Notu

Telefon üzerinden test yapılırken backend adresi `localhost` olmamalıdır.

Telefonun backend’e ulaşabilmesi için bilgisayarın yerel IP adresi kullanılmalıdır.

Örnek:

```ts
const API_BASE_URL = "http://192.168.1.103:3001";
```

Expo terminalinde görünen IP değişirse uygulama içindeki API URL değerleri de güncellenmelidir.

Örnek Expo adresi:

```txt
exp://192.168.1.103:8081
```

Bu durumda backend adresi:

```txt
http://192.168.1.103:3001
```

olmalıdır.

---

## Uygulama Akışları

### 1. Araç Rehberi Gör

Kullanıcı marka, model, yıl, motor, yakıt ve şanzıman bilgilerini girer.

Backend Wikipedia’dan temel araç/model bilgisi alır ve AI ile araç rehberi oluşturur.

Üretilen başlıklar:

- Genel özet
- Kronik sorunlar
- Motor / şanzıman notları
- Bakım notları
- Ekspertiz kontrol listesi
- Satıcıya sorulacak sorular
- Kimler için mantıklı?
- Kimler uzak durmalı?
- Son karar

---

### 2. Bulduğum Aracı Analiz Et

Kullanıcı belirli bir ilan veya araç için detay girer.

Girilen bilgiler:

- Marka
- Model
- Yıl
- Motor
- Yakıt tipi
- Şanzıman
- Kilometre
- İlan fiyatı
- Hasar durumu
- Boya / değişen bilgisi
- Tramer tutarı
- Satıcı notu

AI çıktısı:

- Risk seviyesi
- Fiyat yorumu
- Kilometre yorumu
- Hasar / boya / tramer yorumu
- Tahmini piyasa aralığı
- Benzer kilometre fiyat aralığı
- Temiz örnek fiyat aralığı
- Pazarlık hedefi
- Mekanik riskler
- Pazarlık noktaları
- Ekspertizde baktırılacaklar
- Satıcıya sorulacak sorular
- Kimler için mantıklı?
- Kimler uzak durmalı?
- Son karar

---

### 3. Piyasa Araştırması Yap

Kullanıcı belirli bir aracı seçerek genel piyasa araştırması alır.

Hedef yapı:

- KM segmentlerine göre fiyat aralıkları
- Temiz / hasarsız araç fiyatları
- Boyalı / değişenli araç fiyatları
- Tramerli araç fiyatları
- Ağır hasarlı araç fiyatları
- Kullanıcı fiyat girerse uygun / normal / pahalı yorumu

---

## Backend Endpointleri

### Araç Rehberi

```http
POST /api/vehicle-guide
```

Örnek body:

```json
{
  "brand": "Volkswagen",
  "model": "Golf",
  "year": "2018",
  "engine": "1.4 TSI",
  "fuelType": "Benzin",
  "transmission": "DSG"
}
```

---

### İlan Analizi

```http
POST /api/listing-analysis
```

Örnek body:

```json
{
  "brand": "Volkswagen",
  "model": "Golf",
  "year": "2018",
  "engine": "1.4 TSI",
  "fuelType": "Benzin",
  "transmission": "DSG",
  "km": "132000",
  "price": "1425369",
  "damageStatus": "Hasarsız / Tramersiz",
  "paintStatus": "Temiz",
  "tramerAmount": "0",
  "sellerNote": "Bakımlı araç"
}
```

---

### Piyasa Araştırması

```http
POST /api/market-research
```

---

## Backend Test Örneği

PowerShell üzerinden ilan analizi testi:

```powershell
$body = @{
  brand = "Volkswagen"
  model = "Golf"
  year = "2018"
  engine = "1.4 TSI"
  fuelType = "Benzin"
  transmission = "DSG"
  km = "132000"
  price = "1425369"
  damageStatus = "Hasarsız / Tramersiz"
  paintStatus = "Temiz"
  tramerAmount = "0"
  sellerNote = "Bakımlı araç"
} | ConvertTo-Json

$result = Invoke-RestMethod `
  -Uri "http://localhost:3001/api/listing-analysis" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body

$result.report | ConvertTo-Json -Depth 8
```

---

## Önemli Notlar

- Backend çalışmadan AI raporları üretilemez.
- Telefon ve bilgisayar aynı Wi-Fi ağında olmalıdır.
- Mobil cihazdan backend’e erişmek için `localhost` yerine bilgisayarın yerel IP adresi kullanılmalıdır.
- Gemini Free Tier limitleri dolarsa API `429 quota exceeded` hatası verebilir.
- AI fiyat tahminleri canlı ilan verisi değildir, tahmini yorumdur.
- Satın alma öncesi profesyonel ekspertiz şarttır.
- `.env`, `node_modules`, `.expo` gibi dosyalar GitHub’a gönderilmemelidir.

---

## Geliştirme Planı

Yakın vadede:

- API URL yönetimini tek dosyaya almak
- Theme / style yapılarını toparlamak
- Hata mesajlarını kullanıcı dostu hale getirmek
- Gemini limit durumunu uygulamada daha net göstermek
- AI cevaplarını daha standart JSON formatına sabitlemek
- Piyasa araştırması ekranını geliştirmek
- Rapor geçmişini analiz türlerine göre ayırmak

Orta vadede:

- Sahibinden / ilan linkinden veri çekme
- Ekran görüntüsünden araç bilgisi okuma
- Fotoğraftan araç tanıma
- Marka / model / motor veri tabanını genişletme
- Araç logoları ekleme
- Canlı piyasa verisi entegrasyonu
- Paylaşılabilir rapor çıktısı
- Kullanıcı hesabı ve favori araçlar