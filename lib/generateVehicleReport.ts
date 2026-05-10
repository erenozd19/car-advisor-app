import type { VehicleReport } from "../constants/mockReport";

export type VehicleInput = {
  brand: string;
  model: string;
  year: string;
  engine: string;
  fuelType?: string;
  transmission?: string;
  mileage: string;
  price: string;
  damageInfo?: string;
};

function includesAny(value: string | undefined, keywords: string[]) {
  const text = value?.toLowerCase() || "";
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function parseNumber(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export async function generateVehicleReport(
  vehicle: VehicleInput
): Promise<VehicleReport> {
  console.log("Araç raporu oluşturuluyor:", vehicle);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mileageNumber = parseNumber(vehicle.mileage);
  const priceNumber = parseNumber(vehicle.price);

  const isDiesel = includesAny(vehicle.fuelType, ["dizel", "diesel"]) ||
    includesAny(vehicle.engine, ["tdi", "dci", "hdi", "multijet", "crdi"]);

  const isAutomatic = includesAny(vehicle.transmission, [
    "otomatik",
    "dsg",
    "edc",
    "powershift",
    "cvt",
  ]);

  const isDsg = includesAny(vehicle.transmission, ["dsg"]);
  const isHighMileage = mileageNumber >= 180000;
  const hasDamageInfo = Boolean(vehicle.damageInfo?.trim());

  const risks: string[] = [
    "Kilometre tutarlılığı servis kayıtlarıyla doğrulanmalı.",
    "Boya/değişen durumu ekspertizde netleştirilmeli.",
  ];

  const knownIssues: string[] = [
    "Motor soğukken ilk çalışma kontrol edilmeli.",
    "Düzenli bakım kayıtları istenmeli.",
  ];

  if (isDiesel) {
    risks.push("Dizel motorlarda EGR, DPF ve turbo masraf riski kontrol edilmeli.");
    knownIssues.push("EGR, DPF ve turbo sistemi detaylı kontrol edilmeli.");
  }

  if (isAutomatic) {
    risks.push("Otomatik şanzıman geçişleri test sürüşünde dikkatle kontrol edilmeli.");
    knownIssues.push("Şanzıman geçişlerinde vuruntu, titreme veya gecikme olup olmadığı test edilmeli.");
  }

  if (isDsg) {
    risks.push("DSG şanzımanda kavrama ve mekatronik geçmişi özellikle sorgulanmalı.");
    knownIssues.push("DSG kavrama ve mekatronik kontrolü yapılmalı.");
  }

  if (isHighMileage) {
    risks.push("Kilometre yüksek olduğu için ağır bakım geçmişi ve yıpranma durumu kritik.");
    knownIssues.push("Yüksek kilometre nedeniyle motor, turbo, enjektör ve yürüyen aksam kontrol edilmeli.");
  }

  if (hasDamageInfo) {
    risks.push("Girilen hasar/boya bilgisi ekspertiz ve tramer kaydıyla doğrulanmalı.");
  }

  let score = 7.5;

  if (isHighMileage) score -= 0.8;
  if (isDsg) score -= 0.4;
  if (isDiesel && isHighMileage) score -= 0.4;
  if (hasDamageInfo) score -= 0.2;

  score = Math.max(4.5, Math.min(9, score));

  const riskLevel: VehicleReport["riskLevel"] =
    score >= 7.6 ? "Düşük" : score >= 6.2 ? "Orta" : "Yüksek";

  const decision =
    riskLevel === "Düşük"
      ? "Alınabilir"
      : riskLevel === "Orta"
        ? "Dikkatli alınır"
        : "Riskli, detaylı kontrol şart";

  const vehicleName = `${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.engine}`.trim();

  const marketComment = priceNumber
    ? `${priceNumber.toLocaleString("tr-TR")} TL fiyat girilmiş. Bu fiyatın doğru yorumlanabilmesi için aynı yıl, motor, şanzıman, kilometre ve hasar durumundaki benzer ilanlarla karşılaştırma yapılmalıdır. İlk MVP aşamasında canlı piyasa verisi çekilmediği için bu yorum genel risk değerlendirmesidir.`
    : "Fiyat bilgisi girilmediği için piyasa yorumu sınırlı kaldı.";

  return {
    score,
    decision,
    riskLevel,
    summary: `${vehicleName} için girilen bilgilere göre genel alınabilirlik değerlendirmesi oluşturuldu. Bu rapor, aracın motor, şanzıman, kilometre, fiyat ve hasar bilgilerine göre ön risk analizi sunar.`,
    marketComment,
    finalVerdict:
      riskLevel === "Yüksek"
        ? "Bu araç için ekspertiz sonucu, servis kayıtları ve tramer bilgisi netleşmeden satın alma kararı verilmemelidir. Masraf riski yüksek olabilir."
        : "Ekspertiz sonucu temiz çıkar, kilometre ve bakım geçmişi doğrulanırsa pazarlıkla değerlendirilebilir. Ekspertiz yapılmadan satın alınmamalıdır.",
    sections: [
      {
        title: "Artılar",
        items: [
          "Araç bilgileri girildiği için temel risk analizi yapılabildi.",
          "Bakım geçmişi düzenliyse araç daha güvenli değerlendirilebilir.",
          "Ekspertiz ve servis kaydıyla riskler büyük ölçüde netleşir.",
        ],
      },
      {
        title: "Eksiler / Riskler",
        items: risks,
      },
      {
        title: "Kronik Sorun Kontrolü",
        items: knownIssues,
      },
      {
        title: "Ekspertizde Kontrol Edilecekler",
        items: [
          "Kaporta boya/değişen kontrolü",
          "Tramer ve ağır hasar sorgusu",
          "Motor kompresyon ve yağ kaçak kontrolü",
          "Şanzıman test sürüşü",
          "Alt takım, fren, lastik ve yürüyen aksam",
          "Elektronik arıza kaydı kontrolü",
        ],
      },
      {
        title: "Satıcıya Sorulacak Sorular",
        items: [
          "Ağır hasar veya değişen parça var mı?",
          "Bakım kayıtları mevcut mu?",
          "Son ağır bakım ne zaman yapıldı?",
          "Motor veya şanzıman işlem gördü mü?",
          "Kilometre servis kayıtlarıyla doğrulanabiliyor mu?",
        ],
      },
    ],
  };
}