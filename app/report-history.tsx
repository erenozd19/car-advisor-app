import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_BASE_URL } from "../src/config/api";
import { useReportStore } from "../store/reportStore";

type AnalysisType = "vehicle-guide" | "market-research" | "listing-analysis";

type DbAnalysisReport = {
  id: string;
  analysisType: AnalysisType | string;
  vehiclePayload: any;
  userInputs: any;
  aiReport: any;
  confidenceScore?: number | null;
  createdAt: string;
};

const ANALYSIS_TYPE_LABELS: Record<string, string> = {
  "vehicle-guide": "Araç Rehberi",
  "market-research": "Piyasa Araştırması",
  "listing-analysis": "İlan Analizi",
};

export default function ReportHistoryScreen() {
  const [reports, setReports] = useState<DbAnalysisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const setCurrentReport = useReportStore((state) => state.setCurrentReport);

  const fetchReports = useCallback(async () => {
    try {
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/api/reports?limit=50`);
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json?.message || "Rapor geçmişi alınamadı.");
      }

      setReports(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.log("Rapor geçmişi alınamadı:", error);
      setErrorMessage(
        "Rapor geçmişi alınamadı. Backend açık mı, telefon ve bilgisayar aynı Wi-Fi ağında mı kontrol et."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  function onRefresh() {
    setRefreshing(true);
    fetchReports();
  }

  function getAnalysisTypeLabel(type: string) {
    return ANALYSIS_TYPE_LABELS[type] || "Rapor";
  }

  function getReportTitle(item: DbAnalysisReport) {
    const vehicle = item.vehiclePayload || {};

    const title = `${vehicle.year || ""} ${vehicle.brand || ""} ${
      vehicle.model || ""
    } ${vehicle.engine || ""}`
      .replace(/\s+/g, " ")
      .trim();

    return title || "Araç Raporu";
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Tarih yok";
    }

    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatNumber(value: unknown, suffix: string) {
    if (value === null || value === undefined || value === "") {
      return "Belirtilmedi";
    }

    const cleanedValue = String(value).replace(/[^\d]/g, "");
    const numberValue = Number(cleanedValue);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return "Belirtilmedi";
    }

    return `${numberValue.toLocaleString("tr-TR")} ${suffix}`;
  }

  function getScoreText(item: DbAnalysisReport) {
    if (item.analysisType !== "listing-analysis") {
      return "Skor yok";
    }

    const score = item.aiReport?.score;

    if (typeof score !== "number") {
      return "Skor yok";
    }

    return `${score.toFixed(1)}/100`;
  }

  function getMetaText(item: DbAnalysisReport) {
    const inputs = item.userInputs || {};

    if (item.analysisType === "listing-analysis") {
      return `${formatNumber(inputs.km, "km")} · ${formatNumber(
        inputs.price,
        "TL"
      )}`;
    }

    if (item.analysisType === "market-research") {
      return `${formatNumber(inputs.mileage, "km")} · ${formatNumber(
        inputs.price,
        "TL"
      )}`;
    }

    return "Genel araç rehberi";
  }

  function getDecisionText(item: DbAnalysisReport) {
    const report = item.aiReport || {};

    if (item.analysisType === "listing-analysis") {
      const decision = report.decision || report.finalVerdict || "Karar yok";
      const riskLevel = report.riskLevel || "Risk bilgisi yok";

      return `${decision} · ${riskLevel}`;
    }

    if (item.analysisType === "market-research") {
      return (
        report.pricePosition ||
        report.marketSummary ||
        report.finalComment ||
        "Piyasa araştırması"
      );
    }

    return report.finalVerdict || report.summary || "Araç rehberi";
  }

  function openReport(item: DbAnalysisReport) {
    setCurrentReport(item.aiReport as any);

    const vehicle = item.vehiclePayload || {};
    const inputs = item.userInputs || {};

    if (item.analysisType === "vehicle-guide") {
      router.push({
        pathname: "/vehicle-guide-result",
        params: {
          brand: vehicle.brand || "",
          model: vehicle.model || "",
          year: vehicle.year || "",
          engine: vehicle.engine || "",
          fuelType: vehicle.fuelType || "",
          transmission: vehicle.transmission || "",
          fromHistory: "true",
        },
      });
      return;
    }

    if (item.analysisType === "market-research") {
      router.push({
        pathname: "/market-result",
        params: {
          brand: vehicle.brand || "",
          model: vehicle.model || "",
          year: vehicle.year || "",
          engine: vehicle.engine || "",
          fuelType: vehicle.fuelType || "",
          transmission: vehicle.transmission || "",
          mileage: inputs.mileage || "",
          price: inputs.price || "",
          fromHistory: "true",
        },
      });
      return;
    }

    router.push({
      pathname: "/report-result",
      params: {
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        year: vehicle.year || "",
        engine: vehicle.engine || "",
        fuelType: vehicle.fuelType || "",
        transmission: vehicle.transmission || "",
        mileage: inputs.km || "",
        price: inputs.price || "",
        damageInfo: inputs.damageStatus || "",
        fromHistory: "true",
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Rapor geçmişi yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Geçmiş Raporlarım</Text>
        <Text style={styles.subtitle}>
          Daha önce oluşturduğun araç rehberi, piyasa araştırması ve ilan
          analizleri burada listelenir.
        </Text>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Raporlar alınamadı</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>

            <TouchableOpacity style={styles.primaryButton} onPress={fetchReports}>
              <Text style={styles.primaryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!errorMessage && reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Henüz kayıtlı rapor yok</Text>
            <Text style={styles.emptyText}>
              Bir araç rehberi, piyasa araştırması veya ilan analizi
              oluşturduğunda burada görünecek.
            </Text>
          </View>
        ) : null}

        {!errorMessage &&
          reports.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.reportCard}
              onPress={() => openReport(item)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                  <Text style={styles.typeBadge}>
                    {getAnalysisTypeLabel(item.analysisType)}
                  </Text>

                  <Text style={styles.reportTitle}>{getReportTitle(item)}</Text>
                </View>

                <Text style={styles.scoreText}>{getScoreText(item)}</Text>
              </View>

              <Text style={styles.metaText}>{getMetaText(item)}</Text>

              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>

              <Text style={styles.decisionText}>{getDecisionText(item)}</Text>
            </TouchableOpacity>
          ))}

        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/")}>
          <Text style={styles.backButtonText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    padding: 20,
  },
  loadingText: {
    color: "#d1d5db",
    fontSize: 16,
    marginTop: 14,
    fontWeight: "700",
  },
  title: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  errorCard: {
    backgroundColor: "#7f1d1d",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#991b1b",
    marginBottom: 16,
  },
  errorTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 8,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  emptyCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 22,
  },
  reportCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleArea: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#374151",
    color: "#facc15",
    fontSize: 12,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  reportTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },
  scoreText: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    textAlign: "right",
    maxWidth: 95,
  },
  metaText: {
    color: "#d1d5db",
    fontSize: 14,
    marginTop: 8,
  },
  dateText: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 6,
  },
  decisionText: {
    color: "#facc15",
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginTop: 8,
  },
  primaryButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#facc15",
    alignItems: "center",
    justifyContent: "center",
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
    marginTop: 16,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});