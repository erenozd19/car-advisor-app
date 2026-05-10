export type ReportSection = {
  title: string;
  items: string[];
};

export type VehicleReport = {
  score: number;
  decision: string;
  riskLevel: "Düşük" | "Orta" | "Yüksek";
  summary: string;
  sections: ReportSection[];
  marketComment: string;
  finalVerdict: string;
};

export const mockVehicleReport: VehicleReport = {
  score: 7.2,
  decision: "Dikkatli alınır",
  riskLevel: "Orta",
  summary:
    "Girilen bilgilere göre bu araç alınabilir görünüyor ancak motor, şanzıman, kilometre ve hasar geçmişi detaylı şekilde doğrulanmalıdır.",
  marketComment:
    "Girilen fiyat, aracın kondisyonu ve kilometresi dikkate alınarak değerlendirilmelidir. Net piyasa yorumu için benzer ilanlarla karşılaştırma yapılmalıdır.",
  finalVerdict:
    "Ekspertiz sonucu temiz çıkar, kilometre ve bakım geçmişi doğrulanırsa pazarlıkla değerlendirilebilir. Ekspertiz yapılmadan satın alınmamalıdır.",
  sections: [
    {
      title: "Artılar",
      items: [
        "İkinci el piyasası güçlü olabilir.",
        "Parça ve bakım erişimi kolay olabilir.",
        "Doğru bakımlıysa uzun süre kullanılabilir.",
      ],
    },
    {
      title: "Eksiler / Riskler",
      items: [
        "Şanzıman ve motor geçmişi mutlaka kontrol edilmeli.",
        "Kilometre tutarlılığı servis kayıtlarıyla doğrulanmalı.",
        "Boya/değişen durumu ekspertizde netleştirilmeli.",
      ],
    },
    {
      title: "Kronik Sorun Kontrolü",
      items: [
        "Motor soğukken ilk çalışma kontrol edilmeli.",
        "Şanzıman geçişlerinde vuruntu veya gecikme olup olmadığı test edilmeli.",
        "Turbo, EGR ve DPF gibi masraflı parçalar kontrol edilmeli.",
        "Düzenli bakım kayıtları istenmeli.",
      ],
    },
    {
      title: "Ekspertizde Kontrol Edilecekler",
      items: [
        "Kaporta boya/değişen kontrolü",
        "Tramer ve ağır hasar sorgusu",
        "Motor kompresyon ve yağ kaçak kontrolü",
        "Şanzıman test sürüşü",
        "Alt takım, fren, lastik ve yürüyen aksam",
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