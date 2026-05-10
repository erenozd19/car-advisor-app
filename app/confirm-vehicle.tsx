import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getVehicleAliasSuggestion } from "../data/carAliases";
import { useReportStore } from "../store/reportStore";
const API_BASE_URL = "http://192.168.1.103:3001";

export default function ConfirmVehicleScreen() {
    const params = useLocalSearchParams();
    const [isLoading, setIsLoading] = useState(false);

    const setCurrentReport = useReportStore((state) => state.setCurrentReport);
    const addSavedReport = useReportStore((state) => state.addSavedReport);

    const [vehicle, setVehicle] = useState({
  brand: String(params.brand || ""),
  model: String(params.model || ""),
  year: String(params.year || ""),
  engine: String(params.engine || ""),
  fuelType: String(params.fuelType || ""),
  transmission: String(params.transmission || ""),
  mileage: String(params.mileage || ""),
  price: String(params.price || ""),
  damageInfo: String(params.damageInfo || ""),
});

    const title = `${vehicle.year} ${vehicle.brand} ${vehicle.model} ${vehicle.engine}`.trim();

    const formattedMileage = vehicle.mileage
        ? `${Number(vehicle.mileage).toLocaleString("tr-TR")} km`
        : "Belirtilmedi";

    const formattedPrice = vehicle.price
        ? `${Number(vehicle.price).toLocaleString("tr-TR")} TL`
        : "Belirtilmedi";

    const validationWarnings = getVehicleValidationWarnings(vehicle);
    const aliasSuggestion = getVehicleAliasSuggestion(vehicle.brand, vehicle.model);
    function applyAliasSuggestion() {
  if (!aliasSuggestion) return;

  setVehicle((current) => ({
    ...current,
    brand: aliasSuggestion.brand || current.brand,
    model: aliasSuggestion.model || current.model,
  }));
}
    async function handleCreateReport() {
    try {
        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/api/listing-analysis`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                engine: vehicle.engine,
                fuelType: vehicle.fuelType,
                transmission: vehicle.transmission,
                km: vehicle.mileage,
                price: vehicle.price,
                damageStatus: vehicle.damageInfo,
                paintStatus: vehicle.damageInfo,
                tramerAmount: vehicle.damageInfo,
                sellerNote: vehicle.damageInfo,
            }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data?.message || "İlan analizi oluşturulamadı.");
        }

        const aiReport = data.report;

        const report: any = {
    summary: aiReport.summary || "İlan analizi oluşturuldu.",

    listingRiskLevel: aiReport.listingRiskLevel || "Belirtilmedi",
    riskLevel: aiReport.listingRiskLevel || "Belirtilmedi",

    estimatedMarketRange: aiReport.estimatedMarketRange || "",
    estimatedSimilarKmPrice: aiReport.estimatedSimilarKmPrice || "",
    estimatedCleanPrice: aiReport.estimatedCleanPrice || "",
    pricePosition: aiReport.pricePosition || "",
    negotiationTarget: aiReport.negotiationTarget || "",

    priceComment: aiReport.priceComment || "",
    kmComment: aiReport.kmComment || "",
    damageComment: aiReport.damageComment || "",

    chronicIssues: [
        `Risk seviyesi: ${String(aiReport.listingRiskLevel || "Belirtilmedi")}`,
        String(aiReport.priceComment || "Fiyat yorumu alınamadı."),
        String(aiReport.kmComment || "Kilometre yorumu alınamadı."),
        String(aiReport.damageComment || "Hasar yorumu alınamadı."),
    ].filter(Boolean),

    engineTransmissionNotes: aiReport.mechanicalRisks || [],
    maintenanceNotes: aiReport.negotiationPoints || [],
    expertiseChecklist: aiReport.expertiseChecklist || [],
    buyerQuestions: aiReport.buyerQuestions || [],

    whoShouldBuy: [
        "Ekspertiz sonucu temiz çıkan ve servis geçmişi doğrulanabilen araçları değerlendirmek isteyen kullanıcılar.",
        "Fiyat, kilometre ve hasar durumunu birlikte analiz ederek karar vermek isteyen alıcılar.",
    ],

    whoShouldAvoid: [
        "Ekspertiz yaptırmadan araç almak isteyenler.",
        "Kilometre, tramer veya bakım geçmişi doğrulanamayan araçlardan kaçınmak isteyenler.",
    ],

    finalVerdict:
        aiReport.finalVerdict ||
        "Ekspertiz sonucu temiz çıkmadan ve servis geçmişi doğrulanmadan satın alınmamalıdır.",
};

        setCurrentReport(report);

        addSavedReport({
            id: Date.now().toString(),
            title: title || "Araç Raporu",
            createdAt: new Date().toISOString(),
            vehicle,
            report,
        });

        router.push({
            pathname: "/report-result",
            params: vehicle,
        });
    } catch (error) {
        console.log("Rapor oluşturma hatası:", error);

        Alert.alert(
            "Rapor oluşturulamadı",
            "AI ilan analizi oluşturulurken bir hata oluştu. Backend açık mı ve telefon PC ile aynı Wi-Fi ağında mı kontrol et."
        );
    } finally {
        setIsLoading(false);
    }
}

    function handleEdit() {
        router.back();
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Bilgileri Doğrula</Text>

                <Text style={styles.description}>
                    Rapor bu bilgilerle oluşturulacak. Yanlış bilgi varsa geri dönüp
                    düzenleyebilirsin.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.vehicleTitle}>{title || "Araç Bilgileri"}</Text>

                    <InfoRow label="Marka" value={vehicle.brand || "Belirtilmedi"} />
                    <InfoRow label="Model" value={vehicle.model || "Belirtilmedi"} />
                    <InfoRow label="Yıl" value={vehicle.year || "Belirtilmedi"} />
                    <InfoRow label="Motor" value={vehicle.engine || "Belirtilmedi"} />
                    <InfoRow label="Yakıt" value={vehicle.fuelType || "Belirtilmedi"} />
                    <InfoRow label="Şanzıman" value={vehicle.transmission || "Belirtilmedi"} />
                    <InfoRow label="Kilometre" value={formattedMileage} />
                    <InfoRow label="İlan Fiyatı" value={formattedPrice} />
                    <InfoRow
                        label="Hasar / Boya"
                        value={vehicle.damageInfo || "Belirtilmedi"}
                    />
                </View>

                <View style={styles.checkCard}>
                    <Text style={styles.checkTitle}>Temel Kontrol</Text>

                    {validationWarnings.length === 0 ? (
                        <Text style={styles.checkSuccess}>
                            Yıl, kilometre ve fiyat bilgileri temel kontrole göre mantıklı görünüyor.
                        </Text>
                    ) : (
                        validationWarnings.map((warning, index) => (
                            <Text key={index} style={styles.checkWarning}>
                                • {warning}
                            </Text>
                        ))
                    )}
                </View>
                {aliasSuggestion && (
  <View style={styles.suggestionCard}>
    <Text style={styles.suggestionTitle}>Yazım Önerisi</Text>
    <Text style={styles.suggestionText}>{aliasSuggestion.message}</Text>

    <TouchableOpacity
      style={styles.applySuggestionButton}
      onPress={applyAliasSuggestion}
    >
      <Text style={styles.applySuggestionButtonText}>Öneriyi Uygula</Text>
    </TouchableOpacity>

    <Text style={styles.suggestionHint}>
      Öneriyi uygularsan bilgiler bu ekranda otomatik düzelir.
    </Text>
  </View>
)}

                <View style={styles.warningCard}>
                    <Text style={styles.warningTitle}>Küçük not</Text>
                    <Text style={styles.warningText}>
                        Bu aşamada bilgiler manuel girildiği için marka, model, motor ve fiyat
                        bilgilerini kontrol et. Bir sonraki aşamada yapay zeka bu bilgileri
                        otomatik doğrulamaya başlayacak.
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                    onPress={handleCreateReport}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <ActivityIndicator color="#111827" />
                            <Text style={styles.primaryButtonText}> Rapor hazırlanıyor...</Text>
                        </>
                    ) : (
                        <Text style={styles.primaryButtonText}>Doğru, Rapor Oluştur</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleEdit}
                    disabled={isLoading}
                >
                    <Text style={styles.secondaryButtonText}>Bilgileri Düzenle</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function getVehicleValidationWarnings(vehicle: {
  brand: string;
  model: string;
  year: string;
  engine: string;
  mileage: string;
  price: string;
}) {
  const warnings: string[] = [];

  const currentYear = new Date().getFullYear();
  const yearNumber = Number(vehicle.year);
  const mileageNumber = Number(vehicle.mileage);
  const priceNumber = Number(vehicle.price);

  if (vehicle.brand.trim().length < 2) {
    warnings.push("Marka bilgisi çok kısa görünüyor.");
  }

  if (vehicle.model.trim().length < 1) {
    warnings.push("Model bilgisi boş veya çok kısa görünüyor.");
  }

  if (!yearNumber || yearNumber < 1950 || yearNumber > currentYear + 1) {
    warnings.push("Yıl bilgisi mantıklı aralıkta görünmüyor.");
  }

  if (!mileageNumber || mileageNumber < 0 || mileageNumber > 1000000) {
    warnings.push("Kilometre bilgisi mantıklı aralıkta görünmüyor.");
  }

  if (!priceNumber || priceNumber < 10000) {
    warnings.push("İlan fiyatı çok düşük veya geçersiz görünüyor.");
  }

  if (vehicle.engine.trim().length < 2) {
    warnings.push("Motor bilgisi çok kısa görünüyor.");
  }

  return warnings;
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
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
        marginBottom: 8,
    },
    description: {
        color: "#d1d5db",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 16,
    },
    card: {
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
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: "#374151",
    },
    infoLabel: {
        color: "#9ca3af",
        fontSize: 14,
        fontWeight: "700",
        flex: 1,
    },
    infoValue: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
        flex: 1.4,
        textAlign: "right",
    },
    warningCard: {
        backgroundColor: "#292524",
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: "#57534e",
        marginBottom: 16,
    },
    warningTitle: {
        color: "#facc15",
        fontSize: 15,
        fontWeight: "900",
        marginBottom: 6,
    },
    warningText: {
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
        flexDirection: "row",
        marginTop: 8,
    },
    primaryButtonText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    secondaryButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#374151",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
    },
    secondaryButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    checkCard: {
  backgroundColor: "#172554",
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: "#1d4ed8",
  marginBottom: 14,
},
checkTitle: {
  color: "#bfdbfe",
  fontSize: 15,
  fontWeight: "900",
  marginBottom: 6,
},
checkSuccess: {
  color: "#dbeafe",
  fontSize: 13,
  lineHeight: 20,
},
checkWarning: {
  color: "#dbeafe",
  fontSize: 13,
  lineHeight: 20,
  marginBottom: 4,
},
suggestionCard: {
  backgroundColor: "#312e81",
  borderRadius: 16,
  padding: 14,
  borderWidth: 1,
  borderColor: "#4f46e5",
  marginBottom: 14,
},
suggestionTitle: {
  color: "#c7d2fe",
  fontSize: 15,
  fontWeight: "900",
  marginBottom: 6,
},
suggestionText: {
  color: "#e0e7ff",
  fontSize: 13,
  lineHeight: 20,
  fontWeight: "700",
},
suggestionHint: {
  color: "#c7d2fe",
  fontSize: 12,
  lineHeight: 18,
  marginTop: 8,
},
applySuggestionButton: {
  height: 44,
  borderRadius: 12,
  backgroundColor: "#c7d2fe",
  alignItems: "center",
  justifyContent: "center",
  marginTop: 12,
},
applySuggestionButtonText: {
  color: "#111827",
  fontSize: 14,
  fontWeight: "900",
},
});