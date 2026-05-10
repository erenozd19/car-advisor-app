import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE_URL = "http://192.168.1.103:3001";

type VehicleGuideReport = {
  summary: string;
  chronicIssues: string[];
  engineTransmissionNotes: string[];
  maintenanceNotes: string[];
  expertiseChecklist: string[];
  buyerQuestions: string[];
  whoShouldBuy: string[];
  whoShouldAvoid: string[];
  finalVerdict: string;
};

type VehicleGuideResponse = {
  ok: boolean;
  source?: {
    wikipediaTitle?: string | null;
    wikipediaUrl?: string | null;
    wikipediaExtract?: string | null;
  };
  report?: VehicleGuideReport;
  message?: string;
};

export default function VehicleGuideResultScreen() {
  const params = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VehicleGuideResponse | null>(null);

  const title = `${params.year || ""} ${params.brand || ""} ${
    params.model || ""
  } ${params.engine || ""}`.trim();

  useEffect(() => {
    fetchVehicleGuide();
  }, []);

  async function fetchVehicleGuide() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/vehicle-guide`, {
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
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "Araç rehberi alınamadı.");
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Araç rehberi alınırken bilinmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  const report = data?.report;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Araç Rehberi</Text>

        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleTitle}>{title || "Araç Bilgileri"}</Text>
          <Text style={styles.vehicleText}>
            Yakıt: {params.fuelType || "Belirtilmedi"}
            {params.transmission ? ` · Şanzıman: ${params.transmission}` : ""}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#facc15" size="large" />
            <Text style={styles.loadingText}>
              Wikipedia bilgisi alınıyor, araç rehberi hazırlanıyor...
            </Text>
          </View>
        )}

        {!loading && error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Bir hata oluştu</Text>
            <Text style={styles.errorText}>{error}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={fetchVehicleGuide}>
              <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && report ? (
          <>
            <View style={styles.sourceCard}>
              <Text style={styles.sourceTitle}>Veri Kaynağı</Text>
              <Text style={styles.sourceText}>
                Wikipedia başlığı: {data?.source?.wikipediaTitle || "Bulunamadı"}
              </Text>
              <Text style={styles.sourceSmallText}>
                Bu bilgi genel model/kasa bilgisi için kullanılır. Fiyat analizi
                değildir.
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Genel Değerlendirme</Text>
              <Text style={styles.summaryText}>{report.summary}</Text>
            </View>

            <Section title="Kronik Sorunlar / Riskler" items={report.chronicIssues} />

            <Section
              title="Motor ve Şanzıman Notları"
              items={report.engineTransmissionNotes}
            />

            <Section title="Bakım Notları" items={report.maintenanceNotes} />

            <Section
              title="Ekspertizde Özellikle Baktır"
              items={report.expertiseChecklist}
            />

            <Section title="Satıcıya Sorulacak Sorular" items={report.buyerQuestions} />

            <Section title="Kimler İçin Mantıklı?" items={report.whoShouldBuy} />

            <Section title="Kimler Uzak Durmalı?" items={report.whoShouldAvoid} />

            <View style={styles.finalCard}>
              <Text style={styles.finalTitle}>Son Karar</Text>
              <Text style={styles.finalText}>{report.finalVerdict}</Text>
            </View>
          </>
        ) : null}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/vehicle-guide")}
        >
          <Text style={styles.primaryButtonText}>Yeni Araç Rehberi</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Text style={styles.backButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.map((item, index) => (
        <Text key={index} style={styles.item}>
          • {item}
        </Text>
      ))}
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
  loadingCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#374151",
    alignItems: "center",
    marginBottom: 14,
  },
  loadingText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: "#7f1d1d",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#991b1b",
    marginBottom: 14,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  sourceCard: {
    backgroundColor: "#292524",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#57534e",
    marginBottom: 12,
  },
  sourceTitle: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  sourceText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  sourceSmallText: {
    color: "#e7e5e4",
    fontSize: 12,
    lineHeight: 18,
  },
  summaryCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  summaryTitle: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  summaryText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
  },
  sectionCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  item: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  finalCard: {
    backgroundColor: "#facc15",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  finalTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  finalText: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "800",
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