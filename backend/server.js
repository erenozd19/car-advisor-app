const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());



const PORT = process.env.PORT || 3001;

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Araç analiz backend çalışıyor.",
  });
});

app.post("/api/vehicle-guide", async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
    } = req.body;

    if (!brand || !model || !year) {
      return res.status(400).json({
        ok: false,
        message: "brand, model ve year zorunludur.",
      });
    }

    const vehicleQuery = `${brand} ${model}`;
    const wikiData = await getWikipediaVehicleSummary(vehicleQuery);

    const aiReport = await generateVehicleGuideWithAI({
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
      wikiData,
    });

    res.json({
  ok: true,
  source: {
    wikipediaTitle: wikiData?.title || null,
    wikipediaUrl: wikiData?.url || null,
    wikipediaExtract: wikiData?.extract || null,
  },
  report: aiReport,
});
  } catch (error) {
    console.error("vehicle-guide error:", error);

    res.status(500).json({
      ok: false,
      message: "Araç rehberi oluşturulurken hata oluştu.",
      errorName: error?.name,
      errorMessage: error?.message,
      errorStatus: error?.status,
      errorCode: error?.code,
      errorType: error?.type,
    });
  }
});

app.post("/api/listing-analysis", async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
      km,
      price,
      damageStatus,
      paintStatus,
      tramerAmount,
      sellerNote,
    } = req.body;

    if (!brand || !model || !year) {
      return res.status(400).json({
        ok: false,
        message: "brand, model ve year zorunludur.",
      });
    }

    const vehicleQuery = `${brand} ${model}`;
    const wikiData = await getWikipediaVehicleSummary(vehicleQuery);

    const report = await generateListingAnalysisWithAI({
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
      km,
      price,
      damageStatus,
      paintStatus,
      tramerAmount,
      sellerNote,
      wikiData,
    });

    const normalizedReport = {
  ...report,

  estimatedMarketRange:
    report.estimatedMarketRange ||
    report.marketRange ||
    "AI tahmini piyasa aralığı üretilemedi.",

  estimatedSimilarKmPrice:
    report.estimatedSimilarKmPrice ||
    report.similarKmPrice ||
    "Benzer kilometre fiyat aralığı üretilemedi.",

  estimatedCleanPrice:
    report.estimatedCleanPrice ||
    report.cleanPrice ||
    "Temiz örnek fiyat aralığı üretilemedi.",

  pricePosition:
    report.pricePosition ||
    "Belirsiz",

  negotiationTarget:
    report.negotiationTarget ||
    "Pazarlık hedefi üretilemedi. Benzer ilanlarla karşılaştırma yapılmalı.",
};

    res.json({
  ok: true,
  source: {
    wikipediaTitle: wikiData?.title || null,
    wikipediaUrl: wikiData?.url || null,
    wikipediaExtract: wikiData?.extract || null,
  },
  report: normalizedReport,
});
  } catch (error) {
    console.error("listing-analysis error:", error);

    res.status(500).json({
      ok: false,
      message: "İlan analizi oluşturulurken hata oluştu.",
      errorName: error?.name,
      errorMessage: error?.message,
      errorStatus: error?.status,
      errorCode: error?.code,
      errorType: error?.type,
    });
  }
});

app.post("/api/market-research", async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
      mileage,
      price,
    } = req.body;

    if (!brand || !model || !year) {
      return res.status(400).json({
        ok: false,
        message: "brand, model ve year zorunludur.",
      });
    }

    const vehicleQuery = `${brand} ${model}`;
    const wikiData = await getWikipediaVehicleSummary(vehicleQuery);

    const report = await generateMarketResearchWithAI({
      brand,
      model,
      year,
      engine,
      fuelType,
      transmission,
      mileage,
      price,
      wikiData,
    });

    res.json({
      ok: true,
      source: {
        wikipediaTitle: wikiData?.title || null,
        wikipediaUrl: wikiData?.url || null,
        wikipediaExtract: wikiData?.extract || null,
      },
      report,
    });
  } catch (error) {
    console.error("market-research error:", error);

    res.status(500).json({
      ok: false,
      message: "Piyasa araştırması oluşturulurken hata oluştu.",
      errorName: error?.name,
      errorMessage: error?.message,
      errorStatus: error?.status,
      errorCode: error?.code,
      errorType: error?.type,
    });
  }
});

async function getWikipediaVehicleSummary(query) {
  try {
    const searchUrl =
      "https://en.wikipedia.org/w/api.php?" +
      new URLSearchParams({
        action: "opensearch",
        search: query,
        limit: "1",
        namespace: "0",
        format: "json",
      }).toString();

    const searchResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "AracAnalizApp/0.1 contact@example.com",
      },
    });

    if (!searchResponse.ok) {
      console.warn("Wikipedia search failed:", searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const titles = searchData[1];

    if (!titles || titles.length === 0) {
      console.warn("Wikipedia title not found for:", query);
      return null;
    }

    const title = titles[0];

    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      title
    )}`;

    const summaryResponse = await fetch(summaryUrl, {
      headers: {
        "User-Agent": "AracAnalizApp/0.1 contact@example.com",
      },
    });

    if (!summaryResponse.ok) {
      console.warn("Wikipedia summary failed:", summaryResponse.status);
      return {
        title,
        extract: null,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      };
    }

    const summaryData = await summaryResponse.json();

    return {
      title: summaryData.title,
      extract: summaryData.extract,
      url: summaryData.content_urls?.desktop?.page || null,
    };
  } catch (error) {
    console.warn("Wikipedia error ignored:", error?.message);
    return null;
  }
}

async function generateVehicleGuideWithAI({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  wikiData,
}) {

const prompt = `
Sen Türkiye ikinci el araç alım danışmanı, ekspertiz ön kontrol uzmanı ve araç araştırma asistanı gibi davran.

Kullanıcının seçtiği araç:
Marka: ${brand}
Model: ${model}
Yıl: ${year}
Motor: ${engine || "Belirtilmedi"}
Yakıt: ${fuelType || "Belirtilmedi"}
Şanzıman: ${transmission || "Belirtilmedi"}

Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Görevin:
Bu aracı Türkiye'de ikinci el olarak almayı düşünen, arabadan çok anlamayan bir kullanıcıya sade ama profesyonel bir alım rehberi hazırla.

Çok önemli kurallar:
- Güncel piyasa fiyatı uydurma. Fiyat analizi bu endpoint'in görevi değil.
- Kronik sorunları kesin arıza gibi yazma. "Kontrol edilmeli", "dikkat edilmeli", "risk olabilir" dili kullan.
- Kullanıcının seçtiği motor ve şanzıman bilgisine özel yorum yap.
- Eğer motor/şanzıman bilgisi belirliyse genel modelden çok bu kombinasyona odaklan.
- Türkiye ikinci el piyasasında alıcı gözüyle düşün.
- Ekspertiz yaptırmadan satın alınmaması gerektiğini belirt.
- Çok teknik jargon kullanma; ama önemli teknik noktaları atlama.
- Gereksiz uzun yazma. Her madde net, uygulanabilir ve anlaşılır olsun.
- JSON dışında hiçbir açıklama yazma.
- Her JSON alanı farklı bir amaca hizmet etmeli. Aynı cümleleri farklı başlıklarda tekrar etme.
- "Bakım geçmişi kontrol edilmeli" gibi genel uyarıları her başlıkta tekrar etme; sadece ilgili başlıkta kullan.
- chronicIssues sadece olası arıza/risk alanlarını yazmalı.
- maintenanceNotes sadece bakım geçmişi ve periyodik bakım konularını yazmalı.
- expertiseChecklist sadece ekspertizde kontrol ettirilecek fiziksel/teknik kontrol maddelerini yazmalı.
- buyerQuestions sadece satıcıya sorulacak soru formatında olmalı.
- whoShouldBuy ve whoShouldAvoid maddeleri birbirinin ters kopyası gibi olmamalı.

İçerik beklentisi:
summary:
- Aracın genel karakterini anlat.
- Kullanım amacı, güçlü/zayıf yönleri ve alıcı profili hakkında kısa yorum yap.

chronicIssues:
- Bu araçta veya bu motor/şanzıman kombinasyonunda özellikle kontrol edilmesi gereken riskleri yaz.
- En az 4 madde olsun.
- Örnek mantık: turbo, enjektör, EGR, DPF, DSG kavrama/mekatronik, yağ kaçağı, elektronik, soğutma sistemi, yürüyen aksam.

engineTransmissionNotes:
- Motor ve şanzıman özelinde alıcının dikkat etmesi gerekenleri yaz.
- Şanzıman manuel ise debriyaj, baskı balata, vites geçişi gibi konulara odaklan.
- Şanzıman otomatik/DSG ise kavrama, mekatronik, yağ değişimi, kalkış titremesi, vites geçişi gibi konulara odaklan.

maintenanceNotes:
- Bakım geçmişinde aranacak kayıtları yaz.
- Triger/zincir, yağ bakımı, şanzıman bakımı, fren/lastik, soğutma sistemi gibi konulara değin.

expertiseChecklist:
- Ekspertize gidince özellikle söylenecek kontrol maddelerini yaz.
- Motor, şanzıman, kaporta, şasi, elektronik, alt takım, fren, lastik ayrı ayrı düşün.

buyerQuestions:
- Satıcıya sorulacak net sorular yaz.
- Sorular kullanıcının gerçekten işine yarasın.
- "Bakımları var mı?" gibi çok genel soruların yanında "hangi serviste, fatura var mı, hangi km'de yapıldı" gibi detay soruları da ekle.

whoShouldBuy:
- Bu aracı kimler tercih etmeli?

whoShouldAvoid:
- Bu aracı kimler tercih etmemeli?

finalVerdict:
- Aracın alınabilirlik kararını ver.
- "Temiz ekspertiz, doğrulanabilir km ve düzenli bakım varsa değerlendirilebilir" mantığında net sonuç yaz.
- Kullanıcının ekspertizsiz almaması gerektiğini belirt.

Fiyat analizi için ek kurallar:
- Eğer fiyat girilmişse mutlaka TL bazında tahmini fiyat aralıkları üret.
- Canlı ilan verisi çekmediğini belirt ama kullanıcıya yine de yaklaşık piyasa bandı ver.
- estimatedMarketRange genel tahmini piyasa aralığıdır.
- estimatedSimilarKmPrice girilen kilometreye yakın araçların tahmini fiyat aralığıdır.
- estimatedCleanPrice aynı aracın daha temiz / düşük km / hasarsız örneklerinin tahmini aralığıdır.
- pricePosition alanı yalnızca şu değerlerden biri olsun: "Ucuz", "Normal", "Pahalı", "Çok Pahalı", "Belirsiz".
- negotiationTarget alanında kullanıcının deneyebileceği mantıklı pazarlık hedefini TL aralığı olarak yaz.
- Fiyat girilmemişse fiyat alanlarında "Fiyat girilmedi" veya "Veri yetersiz" yaz.

Şu JSON formatında cevap ver:
{
  "summary": "Bu ilanın kısa özeti",
  "listingRiskLevel": "Düşük / Orta / Yüksek",
  estimatedMarketRange: "Veri yetersiz",
estimatedSimilarKmPrice: "Veri yetersiz",
estimatedCleanPrice: "Veri yetersiz",
pricePosition: "Belirsiz",
negotiationTarget: "Canlı piyasa verisi olmadan net pazarlık hedefi verilemez.",
  "estimatedMarketRange": "Tahmini genel piyasa aralığı. Örnek: 850.000 TL - 980.000 TL",
  "estimatedSimilarKmPrice": "Girilen kilometreye yakın araçların tahmini fiyat aralığı. Örnek: 820.000 TL - 930.000 TL",
  "estimatedCleanPrice": "Temiz / hasarsız / düşük riskli örneklerin tahmini fiyat aralığı. Örnek: 950.000 TL - 1.100.000 TL",
  "pricePosition": "Ucuz / Normal / Pahalı / Çok Pahalı / Belirsiz",
  "negotiationTarget": "Mantıklı pazarlık hedefi. Örnek: 830.000 TL - 860.000 TL arası teklif denenebilir.",
  "priceComment": "Fiyat hakkında yorum",
  "kmComment": "Kilometre hakkında yorum",
  "damageComment": "Hasar/boya/tramer hakkında yorum",
  "mechanicalRisks": ["madde", "madde", "madde"],
  "negotiationPoints": ["madde", "madde", "madde"],
  "expertiseChecklist": ["madde", "madde", "madde", "madde"],
  "buyerQuestions": ["madde", "madde", "madde", "madde"],
  "whoShouldBuy": ["madde", "madde"],
  "whoShouldAvoid": ["madde", "madde"],
  "finalVerdict": "Net alınabilirlik yorumu"
}
`;

  const provider = process.env.AI_PROVIDER || "fallback";

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
      return getFallbackGuide({
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        wikiData,
      });
    }

    return generateWithGemini(prompt);
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
      return getFallbackGuide({
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        wikiData,
      });
    }

    return generateWithOpenAI(prompt);
  }

  return getFallbackGuide({
    brand,
    model,
    year,
    engine,
    fuelType,
    transmission,
    wikiData,
  });
}

async function generateListingAnalysisWithAI({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  km,
  price,
  damageStatus,
  paintStatus,
  tramerAmount,
  sellerNote,
  wikiData,
}) {
  const prompt = `
Sen Türkiye ikinci el araç ilan analizi yapan uzman bir araç alım danışmanısın.

Bu analiz "genel araç rehberi" değildir.
Bu analiz belirli bir ilana/arabaya göre "bu araç alınır mı?" değerlendirmesidir.

Araç bilgileri:
Marka: ${brand}
Model: ${model}
Yıl: ${year}
Motor: ${engine || "Belirtilmedi"}
Yakıt: ${fuelType || "Belirtilmedi"}
Şanzıman: ${transmission || "Belirtilmedi"}
Kilometre: ${km || "Belirtilmedi"}
Fiyat: ${price || "Belirtilmedi"}
Hasar Durumu: ${damageStatus || "Belirtilmedi"}
Boya/Değişen: ${paintStatus || "Belirtilmedi"}
Tramer Tutarı: ${tramerAmount || "Belirtilmedi"}
Satıcı Notu: ${sellerNote || "Belirtilmedi"}

Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Kurallar:
- Güncel canlı ilan verisi çekmediğin için kesin piyasa fiyatı iddiasında bulunma.
- Ancak kullanıcı fiyat girdiyse mutlaka yaklaşık TL fiyat aralığı üret.
- Bu aralıklar "AI destekli tahmini piyasa aralığı" olarak yazılmalı.
- Fiyat yorumu yaparken "canlı piyasa verisiyle doğrulanmalı" uyarısı ekle.
- Bu analizde amaç: kullanıcının ilandaki aracı risk/fırsat açısından anlaması.
- Kullanıcının girdiği fiyatı; yıl, motor, şanzıman, km, hasar/boya/tramer ve satıcı notuyla birlikte değerlendir.
- Her başlık farklı bilgi vermeli, aynı uyarıları tekrar etme.
- Araç alınır/alınmaz kararını ekspertiz şartıyla ver.
- JSON dışında hiçbir şey yazma.

Fiyat analizi için:
- estimatedMarketRange: Aynı yıl/model/motor/şanzıman için genel tahmini piyasa aralığı.
- estimatedSimilarKmPrice: Girilen kilometreye yakın araçların tahmini fiyat aralığı.
- estimatedCleanPrice: Daha temiz, düşük km, hasarsız veya düşük riskli örneklerin tahmini fiyat aralığı.
- pricePosition yalnızca şu değerlerden biri olsun: "Ucuz", "Normal", "Pahalı", "Çok Pahalı", "Belirsiz".
- negotiationTarget: Kullanıcının deneyebileceği mantıklı pazarlık hedefi. TL aralığı olarak yaz.
- Fiyat girilmediyse fiyat alanlarında "Fiyat girilmedi" yaz.

Şu JSON formatında cevap ver:
{
  "summary": "Bu ilanın kısa özeti",
  "listingRiskLevel": "Düşük / Orta / Yüksek",
  "estimatedMarketRange": "Tahmini genel piyasa aralığı. Örnek: 850.000 TL - 980.000 TL",
  "estimatedSimilarKmPrice": "Girilen kilometreye yakın araçların tahmini fiyat aralığı. Örnek: 800.000 TL - 900.000 TL",
  "estimatedCleanPrice": "Temiz / hasarsız / düşük km örneklerin tahmini fiyat aralığı. Örnek: 950.000 TL - 1.100.000 TL",
  "pricePosition": "Ucuz / Normal / Pahalı / Çok Pahalı / Belirsiz",
  "negotiationTarget": "Mantıklı pazarlık hedefi. Örnek: 830.000 TL - 860.000 TL arası teklif denenebilir.",
  "priceComment": "Fiyat hakkında yorum",
  "kmComment": "Kilometre hakkında yorum",
  "damageComment": "Hasar/boya/tramer hakkında yorum",
  "mechanicalRisks": ["madde", "madde", "madde"],
  "negotiationPoints": ["madde", "madde", "madde"],
  "expertiseChecklist": ["madde", "madde", "madde", "madde"],
  "buyerQuestions": ["madde", "madde", "madde", "madde"],
  "finalVerdict": "Net alınabilirlik yorumu"
}
`;

  const provider = process.env.AI_PROVIDER || "fallback";

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
      return getFallbackListingAnalysis();
    }

    return generateWithGemini(prompt);
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
      return getFallbackListingAnalysis();
    }

    return generateWithOpenAI(prompt);
  }

  return getFallbackListingAnalysis();
}

async function generateMarketResearchWithAI({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  mileage,
  price,
  wikiData,
}) {
  const prompt = `
Sen Türkiye ikinci el araç piyasası araştırması yapan uzman bir araç danışmanısın.

Bu analiz "belirli bir ilan alınır mı?" analizi değildir.
Bu analiz seçilen aracın genel piyasa mantığını ve km/hasar segmentlerine göre tahmini fiyat aralıklarını anlatır.

Araç bilgileri:
Marka: ${brand}
Model: ${model}
Yıl: ${year}
Motor: ${engine || "Belirtilmedi"}
Yakıt: ${fuelType || "Belirtilmedi"}
Şanzıman: ${transmission || "Belirtilmedi"}
Kullanıcının girdiği kilometre: ${mileage || "Girilmiyor"}
Kullanıcının girdiği fiyat: ${price || "Girilmiyor"}

Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Çok önemli kurallar:
- Canlı ilan verisine erişimin yoksa kesin güncel fiyat iddiasında bulunma.
- Fiyat aralıklarını "AI destekli tahmini piyasa aralığı" olarak üret.
- Kullanıcıya bu değerlerin canlı ilan verisiyle doğrulanması gerektiğini belirt.
- Türkiye ikinci el araç piyasası mantığına göre düşün.
- KM segmentlerini mutlaka ayrı ayrı değerlendir.
- Hasar durumlarını mutlaka ayrı ayrı değerlendir.
- Aynı cümleleri tekrar etme.
- JSON dışında hiçbir şey yazma.

KM segmentleri:
1. 0 - 50.000 km
2. 50.000 - 100.000 km
3. 100.000 - 150.000 km
4. 150.000 - 200.000 km
5. 200.000 km+

Her segment için şu hasar durumlarına göre tahmini fiyat aralığı üret:
- clean: Temiz / hasarsız / düşük tramer
- paintedChanged: Boyalı veya değişenli
- tramer: Tramer kayıtlı ama ağır hasarsız
- heavyDamaged: Ağır hasar kayıtlı

Fiyat aralıklarını TL olarak yaz.
Örnek format: "850.000 TL - 950.000 TL"

Eğer kullanıcı kilometre girdiyse:
- userMileageSegment alanında hangi segmente girdiğini yaz.
- summary içinde kullanıcının aracının bu segmente girdiğini belirt.

Eğer kullanıcı fiyat girdiyse:
- pricePosition alanında "Uygun / Normal / Pahalı / Veri yetersiz" şeklinde yorum yap.
- priceComment alanında nedenini açıkla.
- Canlı ilan verisi olmadığı için bunun tahmini olduğunu belirt.

Eğer kullanıcı fiyat girmediyse:
- pricePosition: "Fiyat girilmedi"
- priceComment: "Fiyat girilmediği için yalnızca genel piyasa aralıkları yorumlandı." yaz.

Şu JSON formatında cevap ver:
{
  "summary": "genel piyasa özeti",
  "userMileageSegment": "kullanıcı km girdiyse segment, yoksa boş",
  "pricePosition": "Uygun / Normal / Pahalı / Fiyat girilmedi / Veri yetersiz",
  "priceComment": "fiyat yorumu",
  "mileageSegments": [
    {
      "segment": "0 - 50.000 km",
      "clean": "fiyat aralığı",
      "paintedChanged": "fiyat aralığı",
      "tramer": "fiyat aralığı",
      "heavyDamaged": "fiyat aralığı"
    },
    {
      "segment": "50.000 - 100.000 km",
      "clean": "fiyat aralığı",
      "paintedChanged": "fiyat aralığı",
      "tramer": "fiyat aralığı",
      "heavyDamaged": "fiyat aralığı"
    },
    {
      "segment": "100.000 - 150.000 km",
      "clean": "fiyat aralığı",
      "paintedChanged": "fiyat aralığı",
      "tramer": "fiyat aralığı",
      "heavyDamaged": "fiyat aralığı"
    },
    {
      "segment": "150.000 - 200.000 km",
      "clean": "fiyat aralığı",
      "paintedChanged": "fiyat aralığı",
      "tramer": "fiyat aralığı",
      "heavyDamaged": "fiyat aralığı"
    },
    {
      "segment": "200.000 km+",
      "clean": "fiyat aralığı",
      "paintedChanged": "fiyat aralığı",
      "tramer": "fiyat aralığı",
      "heavyDamaged": "fiyat aralığı"
    }
  ],
  "marketWarnings": ["madde", "madde", "madde"],
  "buyingTips": ["madde", "madde", "madde"],
  "finalComment": "son yorum"
}
`;

  const provider = process.env.AI_PROVIDER || "fallback";

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY || !process.env.GEMINI_MODEL) {
      return getFallbackMarketResearch();
    }

    return generateWithGemini(prompt);
  }

  if (provider === "openai") {
    if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) {
      return getFallbackMarketResearch();
    }

    return generateWithOpenAI(prompt);
  }

  return getFallbackMarketResearch();
}

function getFallbackMarketResearch() {
  return {
    summary:
      "AI bağlantısı olmadığı için temel tahmini piyasa araştırması gösteriliyor.",
    userMileageSegment: "",
    pricePosition: "Veri yetersiz",
    priceComment:
      "Fiyatın doğru yorumlanması için canlı ilan verisiyle karşılaştırma gerekir.",
    mileageSegments: [
      {
        segment: "0 - 50.000 km",
        clean: "Veri yetersiz",
        paintedChanged: "Veri yetersiz",
        tramer: "Veri yetersiz",
        heavyDamaged: "Veri yetersiz",
      },
      {
        segment: "50.000 - 100.000 km",
        clean: "Veri yetersiz",
        paintedChanged: "Veri yetersiz",
        tramer: "Veri yetersiz",
        heavyDamaged: "Veri yetersiz",
      },
      {
        segment: "100.000 - 150.000 km",
        clean: "Veri yetersiz",
        paintedChanged: "Veri yetersiz",
        tramer: "Veri yetersiz",
        heavyDamaged: "Veri yetersiz",
      },
      {
        segment: "150.000 - 200.000 km",
        clean: "Veri yetersiz",
        paintedChanged: "Veri yetersiz",
        tramer: "Veri yetersiz",
        heavyDamaged: "Veri yetersiz",
      },
      {
        segment: "200.000 km+",
        clean: "Veri yetersiz",
        paintedChanged: "Veri yetersiz",
        tramer: "Veri yetersiz",
        heavyDamaged: "Veri yetersiz",
      },
    ],
    marketWarnings: [
      "Canlı ilan verisi olmadan fiyat aralıkları kesin kabul edilmemelidir.",
      "Araç geçmişi, km doğrulaması, tramer ve ekspertiz sonucu fiyatı ciddi etkiler.",
    ],
    buyingTips: [
      "Benzer km ve hasar durumundaki ilanlarla karşılaştırma yapılmalıdır.",
      "Bakım geçmişi doğrulanamayan araçlarda pazarlık payı bırakılmalıdır.",
    ],
    finalComment:
      "Piyasa yorumu canlı ilan verisi ve ekspertiz sonucuyla birlikte değerlendirilmelidir.",
  };
}

function getFallbackListingAnalysis() {
  return {
    summary: "AI bağlantısı olmadığı için temel ilan analizi gösteriliyor.",
    listingRiskLevel: "Orta",
    priceComment: "Fiyatın doğru yorumlanması için benzer ilanlarla karşılaştırılması gerekir.",
    kmComment: "Kilometre servis kayıtlarıyla doğrulanmalıdır.",
    damageComment: "Hasar, boya ve tramer bilgisi ekspertizde kontrol edilmelidir.",
    mechanicalRisks: [
      "Motor ve şanzıman test sürüşünde kontrol edilmelidir.",
      "Yağ kaçağı ve elektronik arıza kaydı incelenmelidir.",
    ],
    negotiationPoints: [
      "Bakım geçmişi eksikse pazarlık sebebi olabilir.",
      "Tramer veya boya durumu fiyatı etkileyebilir.",
    ],
    expertiseChecklist: [
      "Kaporta boya/değişen kontrolü",
      "Motor yağ kaçağı kontrolü",
      "Şanzıman test sürüşü",
      "Alt takım ve fren kontrolü",
    ],
    buyerQuestions: [
      "Bakım kayıtları mevcut mu?",
      "Kilometre servis kayıtlarıyla doğrulanıyor mu?",
      "Değişen veya ağır hasar var mı?",
    ],
    finalVerdict:
      "Ekspertiz temiz çıkmadan ve servis geçmişi doğrulanmadan satın alınmamalıdır.",
  };
}

async function generateWithGemini(prompt) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";

  try {
    return JSON.parse(cleanJsonText(text));
  } catch (error) {
    console.error("Gemini JSON parse error:", error);

    return {
      summary: text,
      chronicIssues: [],
      engineTransmissionNotes: [],
      maintenanceNotes: [],
      expertiseChecklist: [],
      buyerQuestions: [],
      whoShouldBuy: [],
      whoShouldAvoid: [],
      finalVerdict: "Gemini raporu üretildi ancak JSON formatı beklenen gibi dönmedi.",
    };
  }
}

async function generateWithOpenAI(prompt) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL,
    input: prompt,
  });

  const text = response.output_text || "";

  try {
    return JSON.parse(cleanJsonText(text));
  } catch (error) {
    console.error("OpenAI JSON parse error:", error);

    return {
      summary: text,
      chronicIssues: [],
      engineTransmissionNotes: [],
      maintenanceNotes: [],
      expertiseChecklist: [],
      buyerQuestions: [],
      whoShouldBuy: [],
      whoShouldAvoid: [],
      finalVerdict: "OpenAI raporu üretildi ancak JSON formatı beklenen gibi dönmedi.",
    };
  }
}

function cleanJsonText(text) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function getFallbackGuide({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  wikiData,
}) {
  return {
    summary: `${year} ${brand} ${model} için genel rehber oluşturuldu. AI API anahtarı/model ayarı yapılmadığı için şimdilik temel fallback içerik gösteriliyor.`,
    chronicIssues: [
      "Motorun soğuk çalıştırması kontrol edilmeli.",
      "Bakım geçmişi ve kilometre tutarlılığı sorgulanmalı.",
      "Model özelinde kronik sorunlar için AI bağlantısı aktif edilince daha detaylı rapor üretilecek.",
    ],
    engineTransmissionNotes: [
      `${engine || "Motor"} ve ${transmission || "şanzıman"} kombinasyonu test sürüşünde kontrol edilmeli.`,
      "Vites geçişlerinde vuruntu, gecikme veya titreme olup olmadığına bakılmalı.",
    ],
    maintenanceNotes: [
      "Periyodik bakım kayıtları istenmeli.",
      "Triger, yağ bakımı, fren, lastik ve yürüyen aksam durumu kontrol edilmeli.",
    ],
    expertiseChecklist: [
      "Kaporta boya/değişen kontrolü",
      "Motor yağ kaçakları",
      "Şanzıman test sürüşü",
      "Alt takım kontrolü",
      "Elektronik arıza taraması",
    ],
    buyerQuestions: [
      "Servis bakımları düzenli mi?",
      "Tramer kaydı var mı?",
      "Değişen veya boyalı parça var mı?",
      "Son büyük bakım ne zaman yapıldı?",
    ],
    whoShouldBuy: [
      "Bakım geçmişi belli, ekspertizi temiz araç arayanlar değerlendirebilir.",
    ],
    whoShouldAvoid: [
      "Masrafsız araç isteyenler, geçmişi belirsiz örneklerden uzak durmalı.",
    ],
    finalVerdict:
      "Ekspertiz ve servis geçmişi temizse değerlendirilebilir; aksi halde riskli olabilir.",
    wikipediaTitle: wikiData?.title || null,
  };
}

app.listen(PORT, () => {
  console.log(`Backend çalışıyor: http://localhost:${PORT}`);
});