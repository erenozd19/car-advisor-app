import { router, useLocalSearchParams } from "expo-router";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useReportStore } from "../store/reportStore";

export default function ReportResultScreen() {
    const params = useLocalSearchParams();

    const title = `${params.year || ""} ${params.brand || ""} ${params.model || ""} ${params.engine || ""
        }`.trim();

    const formattedMileage = params.mileage
        ? `${Number(params.mileage).toLocaleString("tr-TR")} km`
        : "Belirtilmedi";

    const formattedPrice = params.price
        ? `${Number(params.price).toLocaleString("tr-TR")} TL`
        : "Belirtilmedi";

    const report: any = useReportStore((state) => state.currentReport);

    if (!report) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Rapor bulunamadı</Text>
                    <Text style={styles.emptyText}>
                        Lütfen araç bilgilerini girerek yeni bir analiz oluştur.
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push("/create-report")}
                    >
                        <Text style={styles.primaryButtonText}>Yeni Analiz Yap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
                        <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const riskText =
        report.riskLevel ||
        getRiskFromChronicIssues(report.chronicIssues) ||
        "AI Analizi";

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>{title || "Araç Raporu"}</Text>

                <View style={styles.vehicleInfoCard}>
                    <Text style={styles.vehicleInfoTitle}>Girilen Araç Bilgileri</Text>

                    <InfoRow label="Yakıt" value={String(params.fuelType || "Belirtilmedi")} />
                    <InfoRow
                        label="Şanzıman"
                        value={String(params.transmission || "Belirtilmedi")}
                    />
                    <InfoRow label="Kilometre" value={formattedMileage} />
                    <InfoRow label="İlan Fiyatı" value={formattedPrice} />
                    <InfoRow
                        label="Hasar / Boya"
                        value={String(params.damageInfo || "Belirtilmedi")}
                    />
                </View>

                <View style={styles.analysisHeaderCard}>
                    <Text style={styles.analysisHeaderTitle}>İlan Analizi</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{riskText}</Text>
                    </View>
                    <Text style={styles.analysisHeaderText}>
                        Bu rapor, girilen fiyat, kilometre, hasar/boya bilgisi ve AI değerlendirmesine
                        göre hazırlanmıştır. Satın alma öncesi ekspertiz şarttır.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Özet</Text>
                    <Text style={styles.paragraph}>
                        {report.summary || "AI ilan özeti oluşturulamadı."}
                    </Text>
                </View>

                <MarketEstimate report={report} />

                <Section
                    title="Fiyat / KM / Hasar Yorumu"
                    items={report.chronicIssues || []}
                />

                <Section
                    title="Mekanik Riskler"
                    items={report.engineTransmissionNotes || []}
                />

                <Section
                    title="Pazarlık Noktaları"
                    items={report.maintenanceNotes || []}
                />

                <Section
                    title="Ekspertizde Özellikle Baktır"
                    items={report.expertiseChecklist || []}
                />

                <Section
                    title="Satıcıya Sorulacak Sorular"
                    items={report.buyerQuestions || []}
                />

                <Section
                    title="Kimler İçin Mantıklı?"
                    items={report.whoShouldBuy || []}
                />

                <Section
                    title="Kimler Uzak Durmalı?"
                    items={report.whoShouldAvoid || []}
                />

                {report.marketComment ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Piyasa Yorumu</Text>
                        <Text style={styles.paragraph}>{report.marketComment}</Text>
                    </View>
                ) : null}

                <View style={styles.finalCard}>
                    <Text style={styles.finalTitle}>Son Karar</Text>
                    <Text style={styles.finalText}>
                        {report.finalVerdict ||
                            "Ekspertiz sonucu temiz çıkmadan ve servis geçmişi doğrulanmadan satın alınmamalıdır."}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push("/create-report")}
                >
                    <Text style={styles.primaryButtonText}>Yeni Analiz Yap</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.button} onPress={() => router.push("/")}>
                    <Text style={styles.buttonText}>Ana Sayfaya Dön</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

function getRiskFromChronicIssues(items?: string[]) {
    if (!items || !Array.isArray(items)) return "";

    const riskItem = items.find((item) =>
        String(item).toLowerCase().includes("risk seviyesi")
    );

    if (!riskItem) return "";

    return riskItem.replace("Risk seviyesi:", "").trim();
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{label}</Text>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

function Section({ title, items }: { title: string; items: string[] }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {items.map((item, index) => (
                <Text key={index} style={styles.item}>
                    • {item}
                </Text>
            ))}
        </View>
    );
}
function MarketEstimate({ report }: { report: any }) {
    const marketRange =
        report.estimatedMarketRange ||
        report.marketRange ||
        report.marketEstimate?.estimatedMarketRange ||
        report.marketEstimate?.marketRange ||
        "";

    const similarKmPrice =
        report.estimatedSimilarKmPrice ||
        report.similarKmPrice ||
        report.marketEstimate?.estimatedSimilarKmPrice ||
        report.marketEstimate?.similarKmPrice ||
        "";

    const cleanPrice =
        report.estimatedCleanPrice ||
        report.cleanPrice ||
        report.marketEstimate?.estimatedCleanPrice ||
        report.marketEstimate?.cleanPrice ||
        "";

    const pricePosition =
        report.pricePosition ||
        report.marketEstimate?.pricePosition ||
        "";

    const negotiationTarget =
        report.negotiationTarget ||
        report.marketEstimate?.negotiationTarget ||
        "";

    const hasMarketData =
        marketRange ||
        similarKmPrice ||
        cleanPrice ||
        pricePosition ||
        negotiationTarget;

    if (!hasMarketData) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Piyasa Tahmini</Text>

            {marketRange ? (
                <InfoRow label="Genel Piyasa" value={String(marketRange)} />
            ) : null}

            {similarKmPrice ? (
                <InfoRow label="Benzer KM" value={String(similarKmPrice)} />
            ) : null}

            {cleanPrice ? (
                <InfoRow label="Temiz Örnekler" value={String(cleanPrice)} />
            ) : null}

            {pricePosition ? (
                <InfoRow label="Fiyat Durumu" value={String(pricePosition)} />
            ) : null}

            {negotiationTarget ? (
                <Text style={[styles.paragraph, { marginTop: 12 }]}>
                    Pazarlık hedefi: {String(negotiationTarget)}
                </Text>
            ) : null}

            <Text style={styles.smallNote}>
                Bu fiyat aralıkları AI destekli tahmini piyasa yorumudur. Canlı ilan verisiyle doğrulanmalıdır.
            </Text>
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
        fontSize: 26,
        fontWeight: "900",
        color: "#ffffff",
        marginBottom: 18,
    },
    vehicleInfoCard: {
        backgroundColor: "#1f2937",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#374151",
        marginBottom: 14,
    },
    vehicleInfoTitle: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "900",
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingVertical: 6,
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
        fontWeight: "700",
        flex: 1.4,
        textAlign: "right",
    },
    analysisHeaderCard: {
        backgroundColor: "#292524",
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: "#57534e",
        marginBottom: 14,
    },
    analysisHeaderTitle: {
        color: "#facc15",
        fontSize: 20,
        fontWeight: "900",
        marginBottom: 10,
    },
    analysisHeaderText: {
        color: "#e7e5e4",
        fontSize: 15,
        lineHeight: 23,
        marginTop: 10,
    },
    badge: {
        alignSelf: "flex-start",
        backgroundColor: "#374151",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginTop: 2,
    },
    badgeText: {
        color: "#facc15",
        fontSize: 13,
        fontWeight: "900",
    },
    section: {
        backgroundColor: "#1f2937",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#374151",
        marginBottom: 14,
    },
    sectionTitle: {
        color: "#facc15",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 10,
    },
    paragraph: {
        color: "#d1d5db",
        fontSize: 15,
        lineHeight: 23,
    },
    smallNote: {
        color: "#9ca3af",
        fontSize: 13,
        lineHeight: 20,
        marginTop: 12,
    },
    item: {
        color: "#d1d5db",
        fontSize: 15,
        lineHeight: 23,
        marginBottom: 7,
    },
    finalCard: {
        backgroundColor: "#facc15",
        borderRadius: 18,
        padding: 18,
        marginTop: 4,
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
    button: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#374151",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 6,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
    },
    primaryButton: {
        height: 54,
        borderRadius: 14,
        backgroundColor: "#facc15",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        marginBottom: 10,
    },
    primaryButtonText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
    },
    emptyTitle: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "900",
        marginBottom: 10,
    },
    emptyText: {
        color: "#d1d5db",
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 22,
    },
});