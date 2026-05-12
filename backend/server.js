const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const prisma = require("./prismaClient");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/debug-routes-check", (req, res) => {
  res.json({
    ok: true,
    message: "Bu güncel server.js çalışıyor.",
    time: new Date().toISOString(),
  });
});

app.get("/api/vehicles/brands", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      ok: true,
      data: brands,
    });
  } catch (error) {
    console.error("vehicles/brands error:", error);

    res.status(500).json({
      ok: false,
      message: "Markalar alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
function detectTransmission(textValue) {
  const text = String(textValue || "").toLowerCase();

  if (text.includes("dsg")) return "DSG";
  if (text.includes("edc")) return "EDC";
  if (text.includes("tiptronic")) return "Tiptronic";
  if (text.includes("x-tronic")) return "X-Tronic";
  if (text.includes("cvt")) return "CVT";
  if (text.includes("automatic")) return "Otomatik";
  if (text.includes("auto")) return "Otomatik";

  return "Manuel";
}

function formatTechnicalDataForPrompt(technicalData) {
  if (!technicalData) {
    return "Kaynaklı teknik veri gönderilmedi.";
  }

  const powerOptions = Array.isArray(technicalData.powerOptions)
    ? technicalData.powerOptions
      .map((item) => item.powerHp)
      .filter(Boolean)
      .map((hp) => `${hp} HP`)
    : [];

  const uniquePowerOptions = [...new Set(powerOptions)];

  const transmissionLabels = Array.isArray(technicalData.transmissionLabels)
    ? technicalData.transmissionLabels.filter(Boolean)
    : [];

  return `
Kaynaklı teknik veri:
- Motor etiketi: ${technicalData.label || "Belirtilmedi"}
- Yakıt tipi: ${technicalData.fuelType || "Belirtilmedi"}
- Motor hacmi: ${technicalData.engineVolume || "Belirtilmedi"}
- Güç seçenekleri: ${uniquePowerOptions.length ? uniquePowerOptions.join(" / ") : "Belirtilmedi"
    }
- Şanzıman seçenekleri: ${transmissionLabels.length ? [...new Set(transmissionLabels)].join(" / ") : "Belirtilmedi"
    }
- Jenerasyon/kasa kaydı: ${technicalData.generationName || "Belirtilmedi"}
`.trim();
}

function formatTechnicalDataForPrompt(technicalData) {
  if (!technicalData) {
    return "Kaynaklı teknik veri gönderilmedi.";
  }

  const powerOptions = Array.isArray(technicalData.powerOptions)
    ? technicalData.powerOptions
      .map((item) => item.powerHp)
      .filter(Boolean)
      .map((hp) => `${hp} HP`)
      .join(" / ")
    : "";

  const transmissionLabels = Array.isArray(technicalData.transmissionLabels)
    ? technicalData.transmissionLabels.filter(Boolean).join(" / ")
    : "";

  const sourceUrls = Array.isArray(technicalData.sourceUrls)
    ? technicalData.sourceUrls.filter(Boolean).slice(0, 3).join("\n")
    : "";

  return `
Kaynaklı teknik veri:
- Kaynak adı: ${technicalData.sourceName || "Belirtilmedi"}
- Jenerasyon/kasa kaydı: ${technicalData.generationName || "Belirtilmedi"}
- Motor etiketi: ${technicalData.label || "Belirtilmedi"}
- Yakıt tipi: ${technicalData.fuelType || "Belirtilmedi"}
- Motor hacmi: ${technicalData.engineVolume || "Belirtilmedi"}
- Güç seçenekleri: ${powerOptions || technicalData.powerHp || "Belirtilmedi"}
- Şanzıman seçenekleri: ${transmissionLabels || "Belirtilmedi"}
- Kaynak URL:
${sourceUrls || technicalData.sourceUrl || "Belirtilmedi"}
`.trim();
}
function normalizeRiskLevel(value) {
  const text = String(value || "").toLowerCase();

  if (text.includes("düşük") || text.includes("dusuk")) return "Düşük";
  if (text.includes("yüksek") || text.includes("yuksek")) return "Yüksek";
  if (text.includes("orta")) return "Orta";

  return "Orta";
}

function normalizeDecision(value, riskLevel) {
  const text = String(value || "").toLowerCase();

  if (
    text.includes("alınmaz") ||
    text.includes("alinmaz") ||
    text.includes("uzak dur") ||
    text.includes("önermem") ||
    text.includes("onermem")
  ) {
    return "Alınmaz";
  }

  if (
    text.includes("alınabilir") ||
    text.includes("alinabilir") ||
    text.includes("mantıklı") ||
    text.includes("mantikli") ||
    text.includes("değerlendirilebilir") ||
    text.includes("degerlendirilebilir")
  ) {
    return riskLevel === "Yüksek" ? "Dikkatli Alınabilir" : "Alınabilir";
  }

  if (riskLevel === "Yüksek") return "Riskli";
  if (riskLevel === "Düşük") return "Alınabilir";

  return "Dikkatli Alınabilir";
}

function normalizeScore(value, riskLevel, pricePosition) {
  const numericScore = Number(value);

  if (Number.isFinite(numericScore)) {
    return Math.max(0, Math.min(100, Math.round(numericScore)));
  }

  const normalizedPricePosition = String(pricePosition || "").toLowerCase();

  if (riskLevel === "Yüksek") {
    return normalizedPricePosition.includes("ucuz") ? 45 : 35;
  }

  if (riskLevel === "Düşük") {
    if (normalizedPricePosition.includes("pahalı")) return 68;
    return 78;
  }

  if (normalizedPricePosition.includes("çok pahalı")) return 45;
  if (normalizedPricePosition.includes("pahalı")) return 55;
  if (normalizedPricePosition.includes("ucuz")) return 70;

  return 60;
}

function formatTryPrice(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return "Veri yok";
  }

  return `${numberValue.toLocaleString("tr-TR")} TL`;
}

function calculateUserPricePosition(userPrice, marketData) {
  const cleanedUserPrice = Number(String(userPrice || "").replace(/[^\d]/g, ""));
  const medianPrice = Number(marketData?.medianPrice || 0);

  if (
    marketData?.status !== "ready" ||
    !Number.isFinite(cleanedUserPrice) ||
    cleanedUserPrice <= 0 ||
    !Number.isFinite(medianPrice) ||
    medianPrice <= 0
  ) {
    return {
      label: "Canlı veriyle doğrulanamadı",
      differencePercent: null,
    };
  }

  const differencePercent = Math.round(
    ((cleanedUserPrice - medianPrice) / medianPrice) * 100
  );

  if (differencePercent >= 25) {
    return {
      label: "Çok Pahalı",
      differencePercent,
    };
  }

  if (differencePercent >= 10) {
    return {
      label: "Pahalı",
      differencePercent,
    };
  }

  if (differencePercent <= -25) {
    return {
      label: "Çok Uygun / Şüpheli Ucuz",
      differencePercent,
    };
  }

  if (differencePercent <= -10) {
    return {
      label: "Uygun",
      differencePercent,
    };
  }

  return {
    label: "Piyasa Bandında",
    differencePercent,
  };
}

function cleanMarketSourcesByPrice(sources = []) {
  const validSources = Array.isArray(sources)
    ? sources
        .map((source) => ({
          ...source,
          price: Number(source.price || 0),
        }))
        .filter((source) => Number.isFinite(source.price) && source.price > 0)
    : [];

  if (validSources.length < 3) {
    return validSources;
  }

  const prices = validSources
    .map((source) => source.price)
    .sort((a, b) => a - b);

  const middle = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? Math.round((prices[middle - 1] + prices[middle]) / 2)
      : prices[middle];

  const minAllowed = Math.round(median * 0.65);
  const maxAllowed = Math.round(median * 1.45);

  return validSources.filter(
    (source) => source.price >= minAllowed && source.price <= maxAllowed
  );
}

function buildListingMarketFields(marketData, userPrice) {
  if (marketData?.status !== "ready") {
    return {
      estimatedMarketRange:
        "Kaynaklı piyasa verisi bulunamadığı için güvenilir fiyat aralığı üretilemedi.",
      estimatedSimilarKmPrice:
        "Benzer kilometre fiyatı için yeterli kaynaklı veri bulunamadı.",
      estimatedCleanPrice:
        "Temiz örnek fiyatı için yeterli kaynaklı veri bulunamadı.",
      pricePosition: "Canlı veriyle doğrulanamadı",
      negotiationTarget:
        "Kaynaklı piyasa verisi olmadan pazarlık hedefi önerilmedi.",
      marketDataStatus: "insufficient_data",
      marketDataSampleSize: 0,
      marketDataConfidence: "Düşük",
    };
  }

  const cleanedSources = cleanMarketSourcesByPrice(marketData.sources);

if (cleanedSources.length < 2) {
  return {
    estimatedMarketRange:
      "Kaynaklar arasında yeterli benzer fiyat verisi bulunamadığı için güvenilir piyasa aralığı üretilemedi.",
    estimatedSimilarKmPrice:
      "Benzer kilometre için yeterli kaynaklı fiyat verisi bulunamadı.",
    estimatedCleanPrice:
      "Temiz örnek fiyatı için yeterli kaynaklı veri bulunamadı.",
    pricePosition: "Canlı veriyle doğrulanamadı",
    negotiationTarget:
      "Güvenilir piyasa bandı oluşmadığı için pazarlık hedefi önerilmedi.",
    marketDataStatus: "insufficient_data",
    marketDataSampleSize: cleanedSources.length,
    marketDataConfidence: "Düşük",
  };
}

const cleanedPrices = cleanedSources
  .map((source) => Number(source.price))
  .filter((price) => Number.isFinite(price) && price > 0)
  .sort((a, b) => a - b);

const minPrice = cleanedPrices[0];
const maxPrice = cleanedPrices[cleanedPrices.length - 1];

const middle = Math.floor(cleanedPrices.length / 2);
const medianPrice =
  cleanedPrices.length % 2 === 0
    ? Math.round((cleanedPrices[middle - 1] + cleanedPrices[middle]) / 2)
    : cleanedPrices[middle];

marketData = {
  ...marketData,
  sources: cleanedSources,
  minPrice,
  medianPrice,
  maxPrice,
  sampleSize: cleanedSources.length,
};

  const safeMedian =
    Number.isFinite(medianPrice) && medianPrice > 0 ? medianPrice : 0;

  const safeMin =
    Number.isFinite(minPrice) && minPrice > 0
      ? minPrice
      : safeMedian
      ? Math.round(safeMedian * 0.92)
      : 0;

  const safeMax =
    Number.isFinite(maxPrice) && maxPrice > 0
      ? maxPrice
      : safeMedian
      ? Math.round(safeMedian * 1.08)
      : 0;

  const pricePositionResult = calculateUserPricePosition(userPrice, marketData);

  const differenceText =
    pricePositionResult.differencePercent === null
      ? ""
      : ` (${pricePositionResult.differencePercent > 0 ? "+" : ""}${pricePositionResult.differencePercent}%)`;

  const negotiationLow = safeMedian ? Math.round(safeMedian * 0.92) : 0;
  const negotiationHigh = safeMedian ? Math.round(safeMedian * 0.98) : 0;

  return {
    estimatedMarketRange: `${formatTryPrice(safeMin)} - ${formatTryPrice(safeMax)}`,
    estimatedSimilarKmPrice: `${formatTryPrice(safeMin)} - ${formatTryPrice(safeMax)}`,
    estimatedCleanPrice: safeMedian
      ? `${formatTryPrice(Math.round(safeMedian * 0.97))} - ${formatTryPrice(safeMax)}`
      : `${formatTryPrice(safeMin)} - ${formatTryPrice(safeMax)}`,
    pricePosition: `${pricePositionResult.label}${differenceText}`,
    negotiationTarget:
      negotiationLow && negotiationHigh
        ? `${formatTryPrice(negotiationLow)} - ${formatTryPrice(negotiationHigh)} arası teklif denenebilir.`
        : "Pazarlık hedefi için yeterli kaynaklı veri bulunamadı.",
    marketDataStatus: "ready",
    marketDataSampleSize: marketData.sampleSize || 0,
    marketDataConfidence: marketData.confidenceLevel || "Orta",
  };
}
function normalizeListingAnalysisReport(report) {
  const riskLevel = normalizeRiskLevel(
    report?.riskLevel || report?.listingRiskLevel
  );

  const decision = normalizeDecision(
    report?.decision || report?.finalVerdict,
    riskLevel
  );

  const score = normalizeScore(report?.score, riskLevel, report?.pricePosition);

  const marketStatus =
    report?.marketDataStatus ||
    report?.marketData?.status ||
    "unknown";

  const hasReliableMarketData = marketStatus === "ready";

  return {
    ...report,

    score,
    decision,
    riskLevel,
    listingRiskLevel: report?.listingRiskLevel || riskLevel,

    summary:
      report?.summary ||
      "İlan için özet üretilemedi. Ekspertiz ve canlı piyasa kontrolü önerilir.",

    estimatedMarketRange: hasReliableMarketData
      ? report?.estimatedMarketRange ||
        report?.marketRange ||
        "Kaynaklı piyasa aralığı hesaplanamadı."
      : "Yeterli kaynaklı piyasa verisi bulunamadı.",

    estimatedSimilarKmPrice: hasReliableMarketData
      ? report?.estimatedSimilarKmPrice ||
        report?.similarKmPrice ||
        "Benzer kilometre fiyat aralığı hesaplanamadı."
      : "Benzer kilometre için yeterli kaynaklı veri bulunamadı.",

    estimatedCleanPrice: hasReliableMarketData
      ? report?.estimatedCleanPrice ||
        report?.cleanPrice ||
        "Temiz örnek fiyat aralığı hesaplanamadı."
      : "Temiz örnek fiyatı için yeterli kaynaklı veri bulunamadı.",

    pricePosition: hasReliableMarketData
      ? report?.pricePosition || "Canlı veriyle doğrulanamadı"
      : "Yeterli kaynaklı veri yok",

    negotiationTarget: hasReliableMarketData
      ? report?.negotiationTarget || "Pazarlık hedefi hesaplanamadı."
      : "Güvenilir piyasa bandı oluşmadığı için pazarlık hedefi önerilmedi.",

    priceComment: hasReliableMarketData
      ? report?.priceComment ||
        "Fiyat, kaynaklı piyasa verilerine göre değerlendirilmiştir."
      : "Bu araç için yeterli kaynaklı piyasa verisi bulunamadığı için fiyat aralığı güvenilir şekilde hesaplanamadı.",

    kmComment:
      report?.kmComment ||
      "Kilometre servis kayıtları ve ekspertiz ile doğrulanmalıdır.",

    damageComment:
      report?.damageComment ||
      "Hasar, boya ve tramer bilgisi ekspertizde kontrol edilmelidir.",

    mechanicalRisks: Array.isArray(report?.mechanicalRisks)
      ? report.mechanicalRisks
      : ["Motor, şanzıman ve alt takım ekspertizde detaylı kontrol edilmelidir."],

    negotiationPoints: Array.isArray(report?.negotiationPoints)
      ? report.negotiationPoints
      : ["Eksik bakım, yüksek kilometre veya hasar durumu pazarlık sebebi olabilir."],

    expertiseChecklist: Array.isArray(report?.expertiseChecklist)
      ? report.expertiseChecklist
      : [
          "Kaporta boya/değişen kontrolü",
          "Motor yağ kaçağı kontrolü",
          "Şanzıman test sürüşü",
          "Alt takım ve fren kontrolü",
        ],

    buyerQuestions: Array.isArray(report?.buyerQuestions)
      ? report.buyerQuestions
      : [
          "Bakım kayıtları mevcut mu?",
          "Kilometre servis kayıtlarıyla doğrulanıyor mu?",
          "Tramer ve değişen parça detayı nedir?",
        ],

    finalVerdict:
      report?.finalVerdict ||
      "Ekspertiz temiz çıkmadan ve servis geçmişi doğrulanmadan satın alınmamalıdır.",
  };
}
async function saveAnalysisReportSafely({
  analysisType,
  vehiclePayload,
  userInputs = null,
  aiReport,
}) {
  try {
    await prisma.analysisReport.create({
      data: {
        analysisType,
        vehiclePayload,
        userInputs,
        aiReport,
        confidenceScore: aiReport?.confidenceScore || null,
      },
    });
  } catch (error) {
    console.log("Analysis report save failed:", error?.message || error);
  }
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "Araç analiz backend çalışıyor.",
  });
});

app.get("/api/reports", async (req, res) => {
  try {
    const { analysisType, limit } = req.query;

    const take = Math.min(Number(limit) || 50, 100);

    const where = analysisType
      ? {
        analysisType: String(analysisType),
      }
      : undefined;

    const reports = await prisma.analysisReport.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take,
    });

    res.json({
      ok: true,
      data: reports,
    });
  } catch (error) {
    console.error("reports list error:", error);

    res.status(500).json({
      ok: false,
      message: "Rapor geçmişi alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.post("/api/test-market-search", async (req, res) => {
  try {
    const {
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  km,
} = req.body;
    if (!brand || !model || !year) {
      return res.status(400).json({
        ok: false,
        message: "brand, model ve year zorunludur.",
      });
    }
    const searchResult = await getMarketDataWithSearch({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  km,
});

    const marketData = searchResult.marketData;
    const hasGrounding = searchResult.hasGrounding;

    res.json({
      ok: marketData.status === "ready",
      hasGrounding,
      reason: marketData.status === "ready" ? null : "INSUFFICIENT_MARKET_DATA",
      message:
        marketData.status === "ready"
          ? "Kaynaklı piyasa verisi oluşturuldu."
          : "Yeterli kaynaklı piyasa verisi bulunamadı.",
      marketData,
      rawText: searchResult.text,
      groundingMetadata: searchResult.groundingMetadata,
    });
  } catch (error) {
    console.error("test-market-search error:", error);

    res.status(500).json({
      ok: false,
      message: "Piyasa araması yapılırken hata oluştu.",
      errorName: error?.name,
      errorMessage: error?.message,
      errorStatus: error?.status,
      errorCode: error?.code,
    });
  }
});

app.get("/api/vehicles/brands", async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      ok: true,
      data: brands,
    });
  } catch (error) {
    console.error("vehicles/brands error:", error);

    res.status(500).json({
      ok: false,
      message: "Markalar alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/models", async (req, res) => {
  try {
    const { brandId, brand } = req.query;

    let resolvedBrandId = brandId ? String(brandId) : "";

    if (!resolvedBrandId && brand) {
      const foundBrand = await prisma.brand.findFirst({
        where: {
          name: {
            equals: String(brand),
            mode: "insensitive",
          },
        },
      });

      resolvedBrandId = foundBrand?.id || "";
    }

    if (!resolvedBrandId) {
      return res.status(400).json({
        ok: false,
        message: "brandId veya brand zorunludur.",
      });
    }

    const models = await prisma.vehicleModel.findMany({
      where: {
        brandId: resolvedBrandId,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      ok: true,
      data: models,
    });
  } catch (error) {
    console.error("vehicles/models error:", error);

    res.status(500).json({
      ok: false,
      message: "Modeller alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/models", async (req, res) => {
  try {
    const { brandId } = req.query;

    if (!brandId) {
      return res.status(400).json({
        ok: false,
        message: "brandId zorunludur.",
      });
    }

    const models = await prisma.vehicleModel.findMany({
      where: {
        brandId: String(brandId),
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      ok: true,
      data: models,
    });
  } catch (error) {
    console.error("vehicles/models error:", error);

    res.status(500).json({
      ok: false,
      message: "Modeller alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/generations", async (req, res) => {
  try {
    const { modelId } = req.query;

    if (!modelId) {
      return res.status(400).json({
        ok: false,
        message: "modelId zorunludur.",
      });
    }

    const generations = await prisma.generation.findMany({
      where: {
        modelId: String(modelId),
      },
      include: {
        engines: {
          include: {
            transmissions: true,
          },
        },
      },
      orderBy: {
        startYear: "asc",
      },
    });

    res.json({
      ok: true,
      data: generations,
    });
  } catch (error) {
    console.error("vehicles/generations error:", error);

    res.status(500).json({
      ok: false,
      message: "Jenerasyonlar alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/engines", async (req, res) => {
  try {
    const { generationId } = req.query;

    if (!generationId) {
      return res.status(400).json({
        ok: false,
        message: "generationId zorunludur.",
      });
    }

    const engines = await prisma.engineOption.findMany({
      where: {
        generationId: String(generationId),
      },
      orderBy: {
        label: "asc",
      },
    });

    res.json({
      ok: true,
      data: engines,
    });
  } catch (error) {
    console.error("vehicles/engines error:", error);

    res.status(500).json({
      ok: false,
      message: "Motor seçenekleri alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/transmissions", async (req, res) => {
  try {
    const { engineId } = req.query;

    if (!engineId) {
      return res.status(400).json({
        ok: false,
        message: "engineId zorunludur.",
      });
    }

    const transmissions = await prisma.transmissionOption.findMany({
      where: {
        engineId: String(engineId),
      },
      orderBy: {
        label: "asc",
      },
    });

    res.json({
      ok: true,
      data: transmissions,
    });
  } catch (error) {
    console.error("vehicles/transmissions error:", error);

    res.status(500).json({
      ok: false,
      message: "Şanzıman seçenekleri alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/years", async (req, res) => {
  try {
    const { modelId } = req.query;

    if (!modelId) {
      return res.status(400).json({
        ok: false,
        message: "modelId zorunludur.",
      });
    }

    const generations = await prisma.generation.findMany({
      where: {
        modelId: String(modelId),
      },
      select: {
        startYear: true,
        endYear: true,
      },
    });

    const currentYear = new Date().getFullYear();
    const yearsSet = new Set();

    generations.forEach((generation) => {
      const startYear = generation.startYear || currentYear;
      const endYear = generation.endYear || currentYear;

      for (let year = startYear; year <= endYear; year++) {
        yearsSet.add(year);
      }
    });

    const years = Array.from(yearsSet)
      .sort((a, b) => Number(b) - Number(a))
      .map(String);

    res.json({
      ok: true,
      data: years,
    });
  } catch (error) {
    console.error("vehicles/years error:", error);

    res.status(500).json({
      ok: false,
      message: "Yıllar alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
});

app.get("/api/vehicles/engines-by-model-year", async (req, res) => {
  try {
    const { modelId, year } = req.query;

    if (!modelId || !year) {
      return res.status(400).json({
        ok: false,
        message: "modelId ve year zorunludur.",
      });
    }

    const selectedYear = Number(year);

    const generations = await prisma.generation.findMany({
      where: {
        modelId: String(modelId),
      },
      include: {
        engines: {
          include: {
            transmissions: true,
          },
        },
      },
      orderBy: {
        startYear: "asc",
      },
    });

    const matchedGenerations = generations.filter((generation) => {
      const startYear = generation.startYear || 1900;
      const endYear = generation.endYear || new Date().getFullYear();

      return selectedYear >= startYear && selectedYear <= endYear;
    });

    const rawEngines = matchedGenerations.flatMap((generation) =>
      generation.engines.map((engine) => ({
        ...engine,
        generationId: generation.id,
        generationName: generation.name,
      }))
    );

    const sourcePriority = {
      UltimateSpecs: 1,
      "Sample import": 2,
      "Manual seed": 3,
    };

    const normalizedMap = new Map();

    for (const engine of rawEngines) {
      const key = [
        String(engine.label || "").toLowerCase().trim(),
        String(engine.fuelType || "").toLowerCase().trim(),
        String(engine.engineVolume || "").toLowerCase().trim(),
      ].join("|");

      const currentPriority = sourcePriority[engine.sourceName] || 99;

      const enginePowerOption = engine.powerHp
        ? {
          powerHp: engine.powerHp,
          sourceUrl: engine.sourceUrl || null,
          sourceName: engine.sourceName || null,
        }
        : null;

      const engineTransmissionLabelsFromDb = Array.isArray(engine.transmissions)
        ? engine.transmissions.map((item) => item.label || item).filter(Boolean)
        : [];

      const transmissionFallbackText = [
        engine.label,
        engine.sourceUrl,
        engine.specs?.rawRowText,
        engine.specs?.originalLabel,
      ].filter(Boolean).join(" ");

      const fallbackTransmission = detectTransmission
        ? detectTransmission(transmissionFallbackText)
        : null;

      const engineTransmissionLabels = engineTransmissionLabelsFromDb.length
        ? engineTransmissionLabelsFromDb
        : fallbackTransmission
          ? [fallbackTransmission]
          : [];

      if (!normalizedMap.has(key)) {
        normalizedMap.set(key, {
          ...engine,
          powerOptions: enginePowerOption ? [enginePowerOption] : [],
          transmissionLabels: [...new Set(engineTransmissionLabels)],
          sourceUrls: engine.sourceUrl ? [engine.sourceUrl] : [],
        });
        continue;
      }

      const existing = normalizedMap.get(key);
      const existingPriority = sourcePriority[existing.sourceName] || 99;

      if (currentPriority < existingPriority) {
        normalizedMap.set(key, {
          ...engine,
          powerOptions: [
            ...(existing.powerOptions || []),
            ...(enginePowerOption ? [enginePowerOption] : []),
          ],
          transmissionLabels: [
            ...new Set([
              ...(existing.transmissionLabels || []),
              ...engineTransmissionLabels,
            ]),
          ],
          sourceUrls: [
            ...new Set([
              ...(existing.sourceUrls || []),
              ...(engine.sourceUrl ? [engine.sourceUrl] : []),
            ]),
          ],
        });
        continue;
      }

      existing.powerOptions = [
        ...new Map(
          [
            ...(existing.powerOptions || []),
            ...(enginePowerOption ? [enginePowerOption] : []),
          ].map((item) => [String(item.powerHp), item])
        ).values(),
      ].sort((a, b) => a.powerHp - b.powerHp);

      existing.transmissionLabels = [
        ...new Set([
          ...(existing.transmissionLabels || []),
          ...engineTransmissionLabels,
        ]),
      ];

      existing.sourceUrls = [
        ...new Set([
          ...(existing.sourceUrls || []),
          ...(engine.sourceUrl ? [engine.sourceUrl] : []),
        ]),
      ];
    }

    const engines = Array.from(normalizedMap.values()).sort((a, b) => {
      const sourceA = sourcePriority[a.sourceName] || 99;
      const sourceB = sourcePriority[b.sourceName] || 99;

      if (sourceA !== sourceB) return sourceA - sourceB;

      const volumeA = Number(a.engineVolume || 99);
      const volumeB = Number(b.engineVolume || 99);

      if (volumeA !== volumeB) return volumeA - volumeB;

      return String(a.label || "").localeCompare(String(b.label || ""));
    });

    const hasUltimateSpecsData = engines.some(
      (engine) => engine.sourceName === "UltimateSpecs"
    );

    const visibleEngines = hasUltimateSpecsData
      ? engines.filter((engine) => engine.sourceName === "UltimateSpecs")
      : engines;

    res.json({
      ok: true,
      data: visibleEngines,
      meta: {
        modelId: String(modelId),
        year: selectedYear,
        matchedGenerationCount: matchedGenerations.length,
        hasUltimateSpecsData,
        rawEngineCount: rawEngines.length,
        normalizedEngineCount: engines.length,
        visibleEngineCount: visibleEngines.length,
      },
    });
  } catch (error) {
    console.error("vehicles/engines-by-model-year error:", error);

    res.status(500).json({
      ok: false,
      message: "Motor seçenekleri alınırken hata oluştu.",
      errorMessage: error?.message,
    });
  }
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
      technicalData,
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
      technicalData,
      wikiData,
    });
    await saveAnalysisReportSafely({
      analysisType: "vehicle-guide",
      vehiclePayload: {
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        technicalData,
      },
      userInputs: null,
      aiReport,
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
      technicalData,
    } = req.body;

    if (!brand || !model || !year) {
      return res.status(400).json({
        ok: false,
        message: "brand, model ve year zorunludur.",
      });
    }

    const vehicleQuery = `${brand} ${model}`;
    const wikiData = await getWikipediaVehicleSummary(vehicleQuery);
    let marketData = {
  status: "insufficient_data",
  sampleSize: 0,
  sources: [],
  minPrice: 0,
  medianPrice: 0,
  maxPrice: 0,
  confidenceLevel: "Düşük",
  notes: ["Piyasa verisi alınamadı."],
};

try {
  const marketSearchResult = await getMarketDataWithSearch({
    brand,
    model,
    year,
    engine,
    fuelType,
    transmission,
    km,
  });

  marketData = marketSearchResult.marketData;
} catch (marketError) {
  console.error("listing-analysis market search error:", marketError?.message || marketError);
}

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
      technicalData,
      wikiData,
    });

    const marketFields = buildListingMarketFields(marketData, price);

const normalizedReport = normalizeListingAnalysisReport({
  ...report,
  ...marketFields,
  marketData,
});
    await saveAnalysisReportSafely({
      analysisType: "listing-analysis",
      vehiclePayload: {
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        technicalData,
      },
      userInputs: {
        km,
        price,
        damageStatus,
        paintStatus,
        tramerAmount,
        sellerNote,
      },
      aiReport: normalizedReport,
    });
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
      technicalData,
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
      technicalData,
      wikiData,
    });
    await saveAnalysisReportSafely({
      analysisType: "market-research",
      vehiclePayload: {
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        technicalData,
      },
      userInputs: {
        mileage,
        price,
      },
      aiReport: report,
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
  technicalData,
  wikiData,
}) {
  const technicalDataText = formatTechnicalDataForPrompt(technicalData);
  const prompt = `
Sen Türkiye ikinci el araç alım danışmanı, ekspertiz ön kontrol uzmanı ve araç araştırma asistanı gibi davran.

Kullanıcının seçtiği araç:
Marka: ${brand}
Model: ${model}
Yıl: ${year}
Motor: ${engine || "Belirtilmedi"}
Yakıt: ${fuelType || "Belirtilmedi"}
Şanzıman: ${transmission || "Belirtilmedi"}
${technicalDataText}
Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Görevin:
Bu aracı Türkiye'de ikinci el olarak almayı düşünen, arabadan çok anlamayan bir kullanıcıya sade ama profesyonel bir alım rehberi hazırla.

Çok önemli kurallar:
- Kaynaklı teknik veri varsa motor hacmi, yakıt tipi, güç ve şanzıman yorumlarında bu veriyi öncelikli kabul et.
- Kaynaklı teknik veriyle çelişen motor hacmi, güç, yakıt veya şanzıman bilgisi uydurma.
- Kullanıcı HP seçmediyse tek bir HP değerini kesin bilgi gibi yazma.
- Güç seçenekleri birden fazlaysa “bu motor için farklı güç seçenekleri görülebilir” veya “kaynaklı teknik veride farklı güç seçenekleri yer alıyor” şeklinde yaz.
- Motor gücü kullanıcı tarafından belirtilmediyse ruhsat, ilan detayı veya ekspertiz üzerinden doğrulanmalıdır diye belirt.
- Teknik veri kaynaklı olsa bile bunu fiyat/piyasa verisi gibi kullanma.
- Güncel piyasa fiyatı uydurma. Fiyat analizi bu endpoint’in görevi değil.
- Kronik sorunları kesin arıza gibi yazma. “Kontrol edilmeli”, “dikkat edilmeli”, “risk olabilir” dili kullan.
- Kullanıcının seçtiği motor ve şanzıman bilgisine özel yorum yap.
- Eğer motor/şanzıman bilgisi belirliyse genel modelden çok bu kombinasyona odaklan.
- Türkiye ikinci el piyasasında alıcı gözüyle düşün.
- Ekspertiz yaptırmadan satın alınmaması gerektiğini belirt.
- Çok teknik jargon kullanma; ama önemli teknik noktaları atlama.
- Gereksiz uzun yazma. Her madde net, uygulanabilir ve anlaşılır olsun.
- JSON dışında hiçbir açıklama yazma.
- Her JSON alanı farklı bir amaca hizmet etmeli. Aynı cümleleri farklı başlıklarda tekrar etme.
- “Bakım geçmişi kontrol edilmeli” gibi genel uyarıları her başlıkta tekrar etme; sadece ilgili başlıkta kullan.
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
  technicalData,
  wikiData,
}) {
  const technicalDataText = formatTechnicalDataForPrompt(technicalData);
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
${technicalDataText}
Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Kurallar:
- Kaynaklı teknik veri varsa motor hacmi, yakıt tipi, güç ve şanzıman yorumlarında bu veriyi öncelikli kabul et.
- Kaynaklı teknik veriyle çelişen motor hacmi, güç, yakıt veya şanzıman bilgisi uydurma.
- Kullanıcı HP seçmediyse tek bir HP değerini kesin bilgi gibi yazma.
- Güç seçenekleri birden fazlaysa “bu motor için farklı güç seçenekleri görülebilir” veya “ilan özelinde kesin motor gücü ruhsat/ilan detayıyla doğrulanmalıdır” şeklinde belirt.
- Teknik veri fiyat/piyasa verisi değildir; fiyat uygunluğu yorumunu canlı ilan taraması yapılmış gibi gösterme.
- Güncel canlı ilan verisi çekmediğin için kesin piyasa fiyatı iddiasında bulunma.
- Kullanıcı fiyat girdiyse mutlaka yaklaşık TL fiyat aralığı üret.
- Bu aralıkları “AI destekli tahmini piyasa aralığı” olarak yaz.
- Fiyat yorumu yaparken “canlı piyasa verisiyle doğrulanmalı” uyarısını ekle.
- Bu analizde amaç: kullanıcının ilandaki aracı risk/fırsat açısından anlaması.
- Kullanıcının girdiği fiyatı; yıl, motor, şanzıman, km, hasar/boya/tramer ve satıcı notuyla birlikte değerlendir.
- Hasar, boya, tramer, km ve satıcı notu satın alma kararında teknik veriden daha kritik olabilir; bunları ayrı değerlendir.
- İlan fiyatı için kesin “ucuz/pahalı” demek yerine, veri sınırlıysa “tahmini”, “kontrol edilmeli”, “emsal ilanlarla doğrulanmalı” dili kullan.
- Araç alınır/alınmaz kararını ekspertiz şartıyla ver.
- Her başlık farklı bilgi vermeli, aynı uyarıları tekrar etme.
- JSON dışında hiçbir şey yazma.
- score alanı 0-100 arasında sayı olmalı. 100 çok iyi fırsat, 0 çok riskli ilan anlamına gelir.
- decision yalnızca şu değerlerden biri olsun: "Alınabilir", "Dikkatli Alınabilir", "Riskli", "Alınmaz".
- riskLevel yalnızca şu değerlerden biri olsun: "Düşük", "Orta", "Yüksek".
- listingRiskLevel ile riskLevel aynı anlama gelir; ikisini de doldur.

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
  "score": 0,
  "decision": "Alınabilir / Dikkatli Alınabilir / Riskli / Alınmaz",
  "riskLevel": "Düşük / Orta / Yüksek",
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
  technicalData,
  wikiData,
}) {
  const technicalDataText = formatTechnicalDataForPrompt(technicalData);
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
${technicalDataText}
Wikipedia genel bilgi:
Başlık: ${wikiData?.title || "Bulunamadı"}
Özet: ${wikiData?.extract || "Wikipedia özeti bulunamadı."}

Çok önemli kurallar:
- Kaynaklı teknik veri varsa motor hacmi, yakıt tipi, güç ve şanzıman yorumlarında bu veriyi öncelikli kabul et.
- Kaynaklı teknik veriyle çelişen motor hacmi, güç, yakıt veya şanzıman bilgisi uydurma.
- Kullanıcı HP seçmediyse tek bir HP değerini kesin bilgi gibi yazma.
- Güç seçenekleri birden fazlaysa “bu motor için farklı güç seçenekleri görülebilir” veya “motorun donanıma/güce göre piyasa değeri değişebilir” şeklinde belirt.
- Teknik veri fiyat/piyasa verisi değildir; fiyat aralıklarını canlı ilan taraması yapılmış gibi gösterme.
- Canlı ilan verisine erişimin yoksa kesin güncel fiyat iddiasında bulunma.
- Fiyat aralıklarını “AI destekli tahmini piyasa aralığı” olarak üret.
- Kullanıcıya bu değerlerin canlı ilan verisiyle doğrulanması gerektiğini belirt.
- Türkiye ikinci el araç piyasası mantığına göre düşün.
- KM segmentlerini mutlaka ayrı ayrı değerlendir.
- Hasar durumlarını mutlaka ayrı ayrı değerlendir.
- Kullanıcı fiyat girdiyse fiyatın tahmini olarak uygun/normal/pahalı olup olmadığını yorumla.
- Kullanıcı fiyat girmediyse sadece genel tahmini piyasa aralıkları ve dikkat edilmesi gerekenleri yaz.
- Aynı cümleleri tekrar etme.
- Her JSON alanı farklı bir amaca hizmet etmeli.
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
    score: 60,
    decision: "Dikkatli Alınabilir",
    riskLevel: "Orta",
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

async function generateWithGeminiSearch(prompt) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: prompt,
    config: {
      tools: [
        {
          googleSearch: {},
        },
      ],
    },
  });

  const candidate = response?.candidates?.[0] || null;

  return {
    text: response.text || "",
    groundingMetadata: candidate?.groundingMetadata || null,
    candidateKeys: candidate ? Object.keys(candidate) : [],
  };
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

function parseJsonFromGeminiText(text) {
  if (!text) return null;

  let cleaned = String(text).trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonText = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini market JSON parse error:", error?.message || error);
    return null;
  }
}

function calculateMedian(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }

  return sorted[middle];
}

function isHistoricalOrListPriceSource(source) {
  const haystack = [
    source?.title,
    source?.sourceName,
    source?.sourceUrl,
    source?.vehicleText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr-TR");

  const blockedSourceNames = [
    "youtube",
    "youtu.be",
  ];

  if (blockedSourceNames.some((word) => haystack.includes(word))) {
    return true;
  }

  const blockedKeywords = [
    "fiyat listesi",
    "fiyatları açıklandı",
    "fiyat listesi açıklandı",
    "sıfır satış fiyatı",
    "sıfır araç fiyatı",
    "sıfır araba fiyatı",
    "kampanya",
    "kampanyalı",
    "liste fiyatı",
    "tavsiye edilen satış fiyatı",
    "anahtar teslim",
    "bayi fiyatı",
    "güncel fiyat listesi",
    "geçmiş fiyat listesi",
    "ocak",
    "şubat",
    "mart",
    "nisan",
    "mayıs",
    "haziran",
    "temmuz",
    "ağustos",
    "eylül",
    "ekim",
    "kasım",
    "aralık",
  ];

  return blockedKeywords.some((word) => haystack.includes(word));
}

function normalizeMarketSearchResult(parsedResult, hasGrounding) {
  if (!hasGrounding || !parsedResult) {
    return {
      status: "insufficient_data",
      sampleSize: 0,
      sources: [],
      minPrice: 0,
      medianPrice: 0,
      maxPrice: 0,
      confidenceLevel: "Düşük",
      notes: ["Kaynaklı web araması doğrulanamadı."],
    };
  }

  const rawSources = Array.isArray(parsedResult.sources)
    ? parsedResult.sources
    : [];

  const uniqueMap = new Map();

  for (const source of rawSources) {
    const price = Number(source?.price);
    const sourceUrl = String(source?.sourceUrl || "").trim();
    const currency = String(source?.currency || "TRY").toUpperCase();
    if (isHistoricalOrListPriceSource(source)) continue;
    if (!Number.isFinite(price) || price <= 0) continue;
    if (!sourceUrl) continue;
    if (currency !== "TRY") continue;

    const key = `${sourceUrl}-${price}`;

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, {
        title: source?.title || "",
        sourceName: source?.sourceName || "",
        sourceUrl,
        price,
        currency,
        vehicleText: source?.vehicleText || "",
        matchQuality: source?.matchQuality || "Belirsiz",
        confidence: source?.confidence || "Düşük",
      });
    }
  }

  const sources = Array.from(uniqueMap.values());
  const prices = sources.map((item) => item.price).sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      status: "insufficient_data",
      sampleSize: 0,
      sources: [],
      minPrice: 0,
      medianPrice: 0,
      maxPrice: 0,
      confidenceLevel: "Düşük",
      notes: ["Fiyat içeren güvenilir kaynak bulunamadı."],
    };
  }

  let confidenceLevel = "Düşük";

  if (prices.length >= 5) {
    confidenceLevel = "Yüksek";
  } else if (prices.length >= 2) {
    confidenceLevel = "Orta";
  }

  return {
    status: "ready",
    sampleSize: prices.length,
    sources,
    minPrice: prices[0],
    medianPrice: calculateMedian(prices),
    maxPrice: prices[prices.length - 1],
    confidenceLevel,
    notes: Array.isArray(parsedResult.notes) ? parsedResult.notes : [],
  };
}

async function getMarketDataWithSearch({
  brand,
  model,
  year,
  engine,
  fuelType,
  transmission,
  km,
}) {
  const cleanedKm = Number(String(km || "").replace(/[^\d]/g, ""));

let kmSearchText = "";

if (Number.isFinite(cleanedKm) && cleanedKm > 0) {
  const kmMin = Math.max(0, Math.floor(cleanedKm * 0.8));
  const kmMax = Math.ceil(cleanedKm * 1.2);

  kmSearchText = `${cleanedKm} km, özellikle ${kmMin}-${kmMax} km bandındaki ilanlar`;
}
  const searchQueries = [
  `${year} ${brand} ${model} ${engine || ""} ${transmission || ""} ${kmSearchText} ikinci el fiyat`,
  `${year} ${brand} ${model} ${engine || ""} ${transmission || ""} ${kmSearchText} satılık`,
  `${year} ${brand} ${model} ${engine || ""} ${transmission || ""} ${cleanedKm || ""} km TL fiyat`,
`${year} ${brand} ${model} ${engine || ""} ${transmission || ""} ${cleanedKm || ""} km "TL"`,
  `${brand} ${model} ${year} ${engine || ""} ${transmission || ""} ${cleanedKm || ""} km fiyat`,
  `${brand} ${model} ${year} ${engine || ""} ${transmission || ""} ikinci el fiyat`,
  `${brand} ${model} ${year} ${engine || ""} ${transmission || ""} sahibinden arabam fiyat`,
  `${brand} ${model} ${engine || ""} ${transmission || ""} 200000 km ikinci el fiyat`,
`${brand} ${model} ${engine || ""} ${transmission || ""} yüksek km ikinci el fiyat`,
]
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const prompt = `
Türkiye otomobil fiyat araştırması yap.

Araç:
Marka: ${brand}
Model: ${model}
Yıl: ${year}
Motor: ${engine || "Belirtilmedi"}
Yakıt: ${fuelType || "Belirtilmedi"}
Şanzıman: ${transmission || "Belirtilmedi"}
Kilometre: ${Number.isFinite(cleanedKm) && cleanedKm > 0 ? `${cleanedKm} km` : "Belirtilmedi"}
Benzer KM aralığı: ${
  Number.isFinite(cleanedKm) && cleanedKm > 0
    ? `${Math.max(0, Math.floor(cleanedKm * 0.8))} - ${Math.ceil(cleanedKm * 1.2)} km`
    : "Belirtilmedi"
}

Kullanılacak arama sorguları:
${searchQueries.map((query, index) => `${index + 1}. ${query}`).join("\n")}

Çok önemli kurallar:
- Web araması yap.
- Tahmini fiyat yazma.
- "Olabilir", "muhtemelen", "yaklaşık" diyerek fiyat üretme.
- JSON dışında hiçbir şey yazma.

Kaynak/fiyat kuralları:
- Sadece kaynak metninde açıkça görülen sayısal TL fiyatlarını kullan.
- price alanı 0 olamaz.
- Fiyat açıkça görünmüyorsa ilgili kaynak sources listesine eklenmemelidir.
- Kaynakta fiyat açıkça görünmüyorsa, ilan yılı/km/motor doğru olsa bile o kaynağı sources içine alma; sadece notes içinde "fiyatı görünmeyen yakın ilan bulundu" diye belirt.
- Sources listesinde sadece fiyatı açıkça görünen ikinci el ilanları veya güncel satış/fiyat kaynakları yer almalıdır.

Kilometre eşleşme kuralları:
- Girilen kilometreyle birebir aynı km bekleme.
- Kullanıcı kilometre girdiyse kilometreyi birebir arama kriteri değil, benzer kilometre bandı olarak kullan.
- Aynı yıl/model/motor/yakıt/şanzıman için girilen km değerinin yaklaşık %20 altı ve %20 üstündeki ilanları öncelikli kabul et.
- Örneğin kullanıcı 208.000 km girdiyse yaklaşık 166.000 - 250.000 km aralığındaki ilanlar benzer km kabul edilebilir.
- Aynı km bandında fiyatlı kaynak bulunamazsa yakın yıl veya yakın km kaynaklarını sources içine ekleyebilirsin.
- Ancak bu kaynaklarda matchQuality mutlaka "Yakın eşleşme" veya "Zayıf eşleşme" olmalıdır.
- Eğer hiç fiyat içeren ikinci el kaynak bulunamazsa sources boş olabilir.

Eleme kuralları:
- Eski sıfır araç fiyat listelerini, ay bazlı eski fiyat listelerini, kampanya/liste fiyatlarını ve geçmiş liste fiyatlarını ikinci el piyasa fiyatı gibi kullanma.
- Kaynakta fiyat varsa ama yıl/KM tam uymuyorsa yine de sources içine ekleyebilirsin, fakat confidence "Düşük" veya "Orta" olsun.
JSON formatı:
{
  "query": "kullanılan arama mantığı",
  "sampleSize": 0,
  "sources": [
    {
      "title": "kaynak başlığı",
      "sourceName": "kaynak adı",
      "sourceUrl": "kaynak url",
      "price": 0,
      "currency": "TRY",
      "vehicleText": "kaynakta fiyatı görülen araç açıklaması",
      "matchQuality": "Tam eşleşme / Yakın eşleşme / Zayıf eşleşme",
      "confidence": "Düşük / Orta / Yüksek"
    }
  ],
  "minPrice": 0,
  "medianPrice": 0,
  "maxPrice": 0,
  "confidenceLevel": "Düşük / Orta / Yüksek",
  "notes": ["not"]
}
`;

  const searchResult = await generateWithGeminiSearch(prompt);
  const hasGrounding = Boolean(searchResult.groundingMetadata);
  const parsedResult = parseJsonFromGeminiText(searchResult.text);
  console.log("MARKET RAW TEXT:", searchResult.text);
console.log("MARKET PARSED RESULT:", JSON.stringify(parsedResult, null, 2));
  const marketData = normalizeMarketSearchResult(parsedResult, hasGrounding);
  console.log("MARKET NORMALIZED:", JSON.stringify(marketData, null, 2));
  return {
    marketData,
    hasGrounding,
    rawText: searchResult.text,
    groundingMetadata: searchResult.groundingMetadata,
  };
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