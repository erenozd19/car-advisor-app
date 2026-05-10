import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";
import { AppButton } from "../components/AppButton";
import { SelectField } from "../components/SelectField";
import { vehicleDatabase } from "../data/vehicleDatabase";

export default function VehicleGuideScreen() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("");

  const selectedBrand = vehicleDatabase.find((item) => item.name === brand);
  const selectedModel = selectedBrand?.models.find((item) => item.name === model);
  const selectedEngine = selectedModel?.engines.find((item) => item.name === engine);

  const availableModels = selectedBrand?.models || [];
  const availableYears = selectedModel?.years || [];
  const availableEngines = selectedModel?.engines || [];
  const availableTransmissions = selectedEngine?.transmissions || [];

  const fuelType = selectedEngine?.fuelType || "";

  const isFormValid = brand && model && year;

  const selectedTitle = useMemo(() => {
    return `${year} ${brand} ${model} ${engine}`.trim();
  }, [brand, model, year, engine]);

  function selectBrand(value: string) {
    setBrand(value);
    setModel("");
    setYear("");
    setEngine("");
    setTransmission("");
  }

  function selectModel(value: string) {
    setModel(value);
    setYear("");
    setEngine("");
    setTransmission("");
  }

  function selectEngine(value: string) {
    setEngine(value);
    setTransmission("");
  }

  function handleOpenGuide() {
    router.push({
      pathname: "/vehicle-guide-result",
      params: {
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Araç Rehberi</Text>

        <Text style={styles.description}>
          İlan veya fiyat girmeden araç hakkında genel bilgi, kronik sorunlar ve
          dikkat edilmesi gerekenleri öğren.
        </Text>

        <SelectField
          label="Marka Seç"
          placeholder="Marka seç"
          options={vehicleDatabase.map((item) => item.name)}
          selectedValue={brand}
          onSelect={selectBrand}
        />

        {brand && (
          <SelectField
            label="Model Seç"
            placeholder="Model seç"
            options={availableModels.map((item) => item.name)}
            selectedValue={model}
            onSelect={selectModel}
          />
        )}

        {model && (
          <SelectField
            label="Yıl Seç"
            placeholder="Yıl seç"
            options={availableYears.map(String)}
            selectedValue={year}
            onSelect={setYear}
          />
        )}

        {year && (
          <SelectField
            label="Motor Seç"
            placeholder="Motor seç, isteğe bağlı"
            options={availableEngines.map((item) => item.name)}
            selectedValue={engine}
            onSelect={selectEngine}
          />
        )}

        {engine && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Yakıt Tipi</Text>
            <Text style={styles.infoValue}>{fuelType}</Text>
          </View>
        )}

        {engine && (
          <SelectField
            label="Şanzıman Seç"
            placeholder="Şanzıman seç, isteğe bağlı"
            options={availableTransmissions}
            selectedValue={transmission}
            onSelect={setTransmission}
          />
        )}

        {model && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>Seçilen Araç</Text>
            <Text style={styles.previewText}>
              {selectedTitle || "Araç bilgileri seçiliyor..."}
            </Text>

            <Text style={styles.previewSubText}>
              {fuelType ? `Yakıt: ${fuelType}` : "Motor seçimi isteğe bağlı"}
              {transmission ? ` · Şanzıman: ${transmission}` : ""}
            </Text>
          </View>
        )}

        <AppButton
  title="Araç Rehberini Gör"
  onPress={handleOpenGuide}
  disabled={!isFormValid}
  style={{ marginTop: 4 }}
/>

        <AppButton
  title="Ana Sayfaya Dön"
  variant="secondary"
  onPress={() => router.push("/")}
  style={{ marginTop: 14 }}
/>
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
    marginBottom: 8,
  },
  description: {
    color: "#d1d5db",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  infoCard: {
    backgroundColor: "#1f2937",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 16,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  previewCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 4,
    marginBottom: 14,
  },
  previewTitle: {
    color: "#facc15",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 6,
  },
  previewText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },
  previewSubText: {
    color: "#d1d5db",
    fontSize: 14,
    marginTop: 6,
  },
});