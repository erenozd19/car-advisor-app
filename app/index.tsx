import { router } from "expo-router";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { AppButton } from "../components/AppButton";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Araç Alım Danışmanı</Text>

        <Text style={styles.subtitle}>
          İster bulduğun ilanı analiz et, ister araç piyasasını araştır, ister
          kronik sorunları ve dikkat edilmesi gerekenleri öğren.
        </Text>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push("/create-report")}
        >
          <Text style={styles.modeTitle}>Bulduğum Aracı Analiz Et</Text>
          <Text style={styles.modeText}>
            İlan fiyatı, kilometre ve hasar bilgisine göre bu araç alınır mı
            öğren.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push("/market-research")}
        >
          <Text style={styles.modeTitle}>Piyasa Araştırması Yap</Text>
          <Text style={styles.modeText}>
            Araç seç, kilometre ve hasar durumlarına göre ortalama fiyat
            aralıklarını gör.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeCard}
          onPress={() => router.push("/vehicle-guide")}
        >
          <Text style={styles.modeTitle}>Araç Rehberini Gör</Text>
          <Text style={styles.modeText}>
            Kronik sorunlar, bakım masrafları ve ekspertizde dikkat edilmesi
            gerekenleri incele.
          </Text>
        </TouchableOpacity>

        <AppButton
  title="Geçmiş Raporlarım"
  variant="secondary"
  onPress={() => router.push("/report-history")}
  style={{ marginTop: 10 }}
/>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#d1d5db",
    marginBottom: 24,
  },
  modeCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 12,
  },
  modeTitle: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },
  modeText: {
    color: "#d1d5db",
    fontSize: 14,
    lineHeight: 21,
  },
});