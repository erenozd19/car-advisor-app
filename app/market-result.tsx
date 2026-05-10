import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const API_BASE_URL = "http://192.168.1.103:3001";



export default function MarketResultScreen() {
  const params = useLocalSearchParams();

  const [report, setReport] = useState<any>(null);
const [isLoading, setIsLoading] = useState(true);
const [errorMessage, setErrorMessage] = useState("");

useEffect(() => {
  async function fetchMarketResearch() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/market-research`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: params.brand,
          model: params.model,
          year: params.year,
          engine: params.engine,
          fuelType: params.fuelType,
          transmission: params.transmission,
          mileage: params.mileage,
          price: params.price,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data?.message || "Piyasa araştırması alınamadı.");
      }

      setReport(data.report);
    } catch (error) {
      console.log("Piyasa araştırması hatası:", error);
      setErrorMessage(
        "AI piyasa araştırması alınamadı. Backend açık mı ve telefon PC ile aynı Wi-Fi ağında mı kontrol et."
      );
    } finally {
      setIsLoading(false);
    }
  }

  fetchMarketResearch();
}, []);

  const title = `${params.year || ""} ${params.brand || ""} ${
    params.model || ""
  } ${params.engine || ""}`.trim();

  const mileage = Number(String(params.mileage || "").replace(/\D/g, ""));
  const price = Number(String(params.price || "").replace(/\D/g, ""));

  const userSegment = mileage ? getMileageSegment(mileage) : "";

if (isLoading) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#facc15" />
        <Text style={[styles.noteText, { textAlign: "center", marginTop: 16 }]}>
          AI piyasa araştırması hazırlanıyor...
        </Text>
      </View>
    </SafeAreaView>
  );
}

if (errorMessage) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.content, { flex: 1, justifyContent: "center" }]}>
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Bir hata oluştu</Text>
          <Text style={styles.noteText}>{errorMessage}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/market-research")}
        >
          <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Piyasa Değeri</Text>

        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleTitle}>{title || "Araç Bilgileri"}</Text>
          <Text style={styles.vehicleText}>
            Yakıt: {params.fuelType || "Belirtilmedi"}
            {params.transmission ? ` · Şanzıman: ${params.transmission}` : ""}
          </Text>
          <Text style={styles.vehicleText}>
            {mileage
              ? `Girilen KM: ${mileage.toLocaleString("tr-TR")} km`
              : "KM girilmedi, tüm segmentler gösteriliyor."}
          </Text>
          <Text style={styles.vehicleText}>
            {price
              ? `Girilen Fiyat: ${price.toLocaleString("tr-TR")} TL`
              : "Fiyat girilmedi, sadece ortalama piyasa aralıkları gösteriliyor."}
          </Text>
        </View>

        {userSegment && (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightTitle}>Senin KM Segmentin</Text>
            <Text style={styles.highlightText}>
              Girdiğin kilometre {userSegment} aralığına giriyor. Aşağıdaki tabloda
              bu segmenti özellikle dikkate almalısın.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>KM ve Hasar Durumuna Göre Aralıklar</Text>

        {report?.mileageSegments?.map((segment: any) => {
  const segmentLabel = segment.segment || segment.label;
  const isUserSegment =
    report?.userMileageSegment &&
    String(report.userMileageSegment).includes(segmentLabel);

  return (
    <View
      key={segmentLabel}
      style={[styles.segmentCard, isUserSegment && styles.segmentCardActive]}
    >
      <Text
        style={[
          styles.segmentTitle,
          isUserSegment && styles.segmentTitleActive,
        ]}
      >
        {segmentLabel}
      </Text>

      <PriceRow label="Temiz / Hasarsız" value={segment.clean} />
      <PriceRow
        label="Boyalı / Değişenli"
        value={segment.paintedChanged}
      />
      <PriceRow label="Tramerli" value={segment.tramer} />
      <PriceRow label="Ağır Hasarlı" value={segment.heavyDamaged} />
    </View>
  );
})}

        <View style={styles.noteCard}>
  <Text style={styles.noteTitle}>AI Piyasa Yorumu</Text>
  <Text style={styles.noteText}>
    {report?.summary ||
      "Bu fiyatlar AI destekli tahmini piyasa aralığıdır. Canlı ilan verisiyle doğrulanmalıdır."}
  </Text>

  {report?.pricePosition && (
    <Text style={[styles.noteText, { marginTop: 8 }]}>
      Fiyat Durumu: {report.pricePosition}
    </Text>
  )}

  {report?.priceComment && (
    <Text style={[styles.noteText, { marginTop: 8 }]}>
      {report.priceComment}
    </Text>
  )}

  {report?.finalComment && (
    <Text style={[styles.noteText, { marginTop: 8 }]}>
      {report.finalComment}
    </Text>
  )}
</View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/market-research")}
        >
          <Text style={styles.primaryButtonText}>Yeni Piyasa Araştırması</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Text style={styles.backButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getMileageSegment(mileage: number) {
  if (mileage <= 50000) return "0 - 50.000 km";
  if (mileage <= 100000) return "50.000 - 100.000 km";
  if (mileage <= 150000) return "100.000 - 150.000 km";
  if (mileage <= 200000) return "150.000 - 200.000 km";
  return "200.000 km+";
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 14,
  },
  vehicleCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 14,
  },
  vehicleTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 8,
  },
  vehicleText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
  },
  highlightCard: {
    backgroundColor: "#312e81",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#4f46e5",
    marginBottom: 14,
  },
  highlightTitle: {
    color: "#c7d2fe",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  highlightText: {
    color: "#e0e7ff",
    fontSize: 14,
    lineHeight: 21,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },
  segmentCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  segmentCardActive: {
    borderColor: "#facc15",
  },
  segmentTitle: {
    color: "#facc15",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 10,
  },
  segmentTitleActive: {
    color: "#fde68a",
  },
  priceRow: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    paddingVertical: 8,
  },
  priceLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 3,
  },
  priceValue: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  noteCard: {
    backgroundColor: "#292524",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#57534e",
    marginTop: 4,
    marginBottom: 16,
  },
  noteTitle: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  noteText: {
    color: "#e7e5e4",
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
  backButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});