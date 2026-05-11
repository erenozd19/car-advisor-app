import { router } from "expo-router";
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useReportStore } from "../store/reportStore";

export default function ReportHistoryScreen() {
    const savedReports = useReportStore((state) => state.savedReports);
    const setCurrentReport = useReportStore((state) => state.setCurrentReport);
    const clearSavedReports = useReportStore((state) => state.clearSavedReports);

    function openReport(reportId: string) {
        const savedReport = savedReports.find((item) => item.id === reportId);

        if (!savedReport) return;

        setCurrentReport(savedReport.report);

        router.push({
            pathname: "/report-result",
            params: {
                brand: savedReport.vehicle?.brand || "",
                model: savedReport.vehicle?.model || "",
                year: savedReport.vehicle?.year || "",
                engine: savedReport.vehicle?.engine || "",
                fuelType: savedReport.vehicle?.fuelType || "",
                transmission: savedReport.vehicle?.transmission || "",
                mileage: savedReport.vehicle?.mileage || "",
                price: savedReport.vehicle?.price || "",
                damageInfo: savedReport.vehicle?.damageInfo || "",
            },
        });
    }

    function formatScore(score: unknown) {
        if (typeof score !== "number") return "Skor yok";
        return score.toFixed(1);
    }

    function formatNumber(value: unknown, suffix: string) {
        const numberValue = Number(value);

        if (!value || Number.isNaN(numberValue)) {
            return "Belirtilmedi";
        }

        return `${numberValue.toLocaleString("tr-TR")} ${suffix}`;
    }

    function formatDate(value: unknown) {
        if (!value) return "Tarih yok";

        const date = new Date(String(value));

        if (Number.isNaN(date.getTime())) {
            return "Tarih yok";
        }

        return date.toLocaleDateString("tr-TR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getDecisionText(report: any) {
        const decision = report?.decision || "Değerlendirme yok";
        const riskLevel = report?.riskLevel ? `${report.riskLevel} Risk` : "Risk bilgisi yok";

        return `${decision} · ${riskLevel}`;
    }

    function handleClearHistory() {
        if (savedReports.length === 0) return;

        Alert.alert(
            "Geçmişi temizle",
            "Tüm geçmiş raporları silmek istediğine emin misin?",
            [
                {
                    text: "İptal",
                    style: "cancel",
                },
                {
                    text: "Sil",
                    style: "destructive",
                    onPress: () => clearSavedReports(),
                },
            ]
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>Geçmiş Raporlarım</Text>

                {savedReports.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Henüz rapor yok</Text>
                        <Text style={styles.emptyText}>
                            İlk araç analizini oluşturduğunda raporların burada görünecek.
                        </Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push("/create-report")}
                        >
                            <Text style={styles.primaryButtonText}>Yeni Analiz Yap</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    savedReports.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.reportCard}
                            onPress={() => openReport(item.id)}
                        >
                            <View style={styles.reportTopRow}>
                                <Text style={styles.reportTitle}>
                                    {item.title || "Araç Raporu"}
                                </Text>

                                <Text style={styles.score}>
                                    {formatScore(item.report?.score)}
                                </Text>
                            </View>

                            <Text style={styles.reportMeta}>
                                {formatNumber(item.vehicle?.mileage, "km")} ·{" "}
                                {formatNumber(item.vehicle?.price, "TL")}
                            </Text>

                            <Text style={styles.reportDate}>
                                {formatDate(item.createdAt)}
                            </Text>

                            <Text style={styles.reportDecision}>
                                {getDecisionText(item.report)}
                            </Text>
                        </TouchableOpacity>
                    ))
                )}

                {savedReports.length > 0 && (
                    <TouchableOpacity style={styles.dangerButton} onPress={handleClearHistory}>
                        <Text style={styles.dangerButtonText}>Geçmiş Raporları Temizle</Text>
                    </TouchableOpacity>
                )}

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
    title: {
        color: "#ffffff",
        fontSize: 28,
        fontWeight: "900",
        marginBottom: 18,
    },
    emptyCard: {
        backgroundColor: "#1f2937",
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: "#374151",
    },
    emptyTitle: {
        color: "#ffffff",
        fontSize: 20,
        fontWeight: "900",
        marginBottom: 8,
    },
    emptyText: {
        color: "#d1d5db",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 18,
    },
    reportCard: {
        backgroundColor: "#1f2937",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#374151",
        marginBottom: 12,
    },
    reportTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "flex-start",
    },
    reportTitle: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "900",
        flex: 1,
        lineHeight: 23,
    },
    score: {
        color: "#facc15",
        fontSize: 18,
        fontWeight: "900",
        textAlign: "right",
        maxWidth: 90,
    },
    reportMeta: {
        color: "#d1d5db",
        fontSize: 14,
        marginTop: 8,
    },
    reportDate: {
        color: "#94a3b8",
        fontSize: 13,
        marginTop: 6,
    },
    reportDecision: {
        color: "#facc15",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 8,
    },
    primaryButton: {
        height: 52,
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
    dangerButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#7f1d1d",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 16,
        borderWidth: 1,
        borderColor: "#991b1b",
    },
    dangerButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "900",
    },
});