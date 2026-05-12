import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppButton } from "../components/AppButton";
import { SelectField } from "../components/SelectField";
import {
  Brand,
  EngineOption,
  getBrands,
  getEnginesByModelYear,
  getModels,
  getTransmissions,
  getYears,
  TransmissionOption,
  VehicleModel,
} from "../src/services/vehicleCatalogApi";

export default function MarketResearchScreen() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [transmission, setTransmission] = useState("");
  const [mileage, setMileage] = useState("");
  const [price, setPrice] = useState("");

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [engineId, setEngineId] = useState("");

  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [engines, setEngines] = useState<EngineOption[]>([]);
  const [transmissions, setTransmissions] = useState<TransmissionOption[]>([]);

  const [catalogError, setCatalogError] = useState("");

  const selectedEngine = engines.find((item) => item.id === engineId);
  const fuelType = selectedEngine?.fuelType || "";
    const selectedEngineTechnicalData = selectedEngine
    ? {
        label: selectedEngine.label,
        fuelType: selectedEngine.fuelType || "",
        engineVolume: selectedEngine.engineVolume || "",
        powerHp: selectedEngine.powerHp || null,
        torqueNm: selectedEngine.torqueNm || null,
        sourceName: selectedEngine.sourceName || "",
        sourceUrl: selectedEngine.sourceUrl || "",
        sourceUrls: selectedEngine.sourceUrls || [],
        powerOptions: selectedEngine.powerOptions || [],
        transmissionLabels: selectedEngine.transmissionLabels || [],
        generationName: selectedEngine.generationName || "",
      }
    : null;

  const isFormValid = Boolean(brand && model && year && engine);

  const selectedTitle = useMemo(() => {
    return `${year} ${brand} ${model} ${engine}`.trim();
  }, [brand, model, year, engine]);

  useEffect(() => {
    async function loadBrands() {
      try {
        setCatalogError("");
        const data = await getBrands();
        setBrands(data);
      } catch (error) {
        console.log("Markalar alınamadı:", error);
        setCatalogError("Markalar alınamadı. Backend açık mı kontrol et.");
      }
    }

    loadBrands();
  }, []);

  useEffect(() => {
    if (!brandId) return;

    async function loadModels() {
      try {
        setCatalogError("");
        const data = await getModels(brandId);
        setModels(data);
      } catch (error) {
        console.log("Modeller alınamadı:", error);
        setCatalogError("Modeller alınamadı.");
      }
    }

    loadModels();
  }, [brandId]);

  useEffect(() => {
    if (!modelId) return;

    async function loadYears() {
      try {
        setCatalogError("");
        const data = await getYears(modelId);
        setYears(data);
      } catch (error) {
        console.log("Yıllar alınamadı:", error);
        setCatalogError("Yıllar alınamadı.");
      }
    }

    loadYears();
  }, [modelId]);

  useEffect(() => {
    if (!modelId || !year) return;

    async function loadEngines() {
      try {
        setCatalogError("");
        const data = await getEnginesByModelYear(modelId, year);
        setEngines(data);
      } catch (error) {
        console.log("Motorlar alınamadı:", error);
        setCatalogError("Motorlar alınamadı.");
      }
    }

    loadEngines();
  }, [modelId, year]);

  useEffect(() => {
    if (!engineId) return;

    async function loadTransmissions() {
      try {
        setCatalogError("");
        const data = await getTransmissions(engineId);
        setTransmissions(data);
      } catch (error) {
        console.log("Şanzımanlar alınamadı:", error);
        setCatalogError("Şanzımanlar alınamadı.");
      }
    }

    loadTransmissions();
  }, [engineId]);

  function selectBrand(value: string) {
    const selected = brands.find((item) => item.name === value);

    setBrand(value);
    setBrandId(selected?.id || "");

    setModel("");
    setModelId("");
    setYear("");
    setEngine("");
    setEngineId("");
    setTransmission("");

    setModels([]);
    setYears([]);
    setEngines([]);
    setTransmissions([]);
  }

  function selectModel(value: string) {
    const selected = models.find((item) => item.name === value);

    setModel(value);
    setModelId(selected?.id || "");

    setYear("");
    setEngine("");
    setEngineId("");
    setTransmission("");

    setYears([]);
    setEngines([]);
    setTransmissions([]);
  }

  function selectYear(value: string) {
    setYear(value);

    setEngine("");
    setEngineId("");
    setTransmission("");

    setEngines([]);
    setTransmissions([]);
  }

  function selectEngine(value: string) {
    const selected = engines.find((item) => item.label === value);

    setEngine(value);
    setEngineId(selected?.id || "");

    setTransmission("");
    setTransmissions([]);
  }

  function handleResearch() {
    router.push({
      pathname: "/market-result",
      params: {
        brand,
        model,
        year,
        engine,
        fuelType,
        transmission,
        mileage,
        price,
        technicalData: selectedEngineTechnicalData
  ? JSON.stringify(selectedEngineTechnicalData)
  : "",
      },
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Piyasa Araştırması</Text>

        <Text style={styles.description}>
          İlan bulmadan araç seç. KM ve fiyat girersen rapor daha net yorum
          yapar; boş bırakırsan genel piyasa aralıkları gösterilir.
        </Text>

        {catalogError ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{catalogError}</Text>
          </View>
        ) : null}

        <SelectField
          label="Marka Seç"
          placeholder="Marka seç"
          options={brands.map((item) => item.name)}
          selectedValue={brand}
          onSelect={selectBrand}
        />

        {brand && (
          <SelectField
            label="Model Seç"
            placeholder="Model seç"
            options={models.map((item) => item.name)}
            selectedValue={model}
            onSelect={selectModel}
          />
        )}

        {model && (
          <SelectField
            label="Yıl Seç"
            placeholder="Yıl seç"
            options={years}
            selectedValue={year}
            onSelect={selectYear}
          />
        )}

        {year && (
          <SelectField
            label="Motor Seç"
            placeholder="Motor seç"
            options={engines.map((item) => item.label)}
            selectedValue={engine}
            onSelect={selectEngine}
          />
        )}

        {engine && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Yakıt Tipi</Text>
            <Text style={styles.infoValue}>{fuelType || "Belirtilmedi"}</Text>
          </View>
        )}

        {engine && (
          <SelectField
            label="Şanzıman Seç"
            placeholder="Şanzıman seç, isteğe bağlı"
            options={transmissions.map((item) => item.label)}
            selectedValue={transmission}
            onSelect={setTransmission}
          />
        )}

        {engine && (
          <>
            <Text style={styles.label}>Kilometre, isteğe bağlı</Text>
            <TextInput
              style={styles.input}
              value={mileage}
              onChangeText={setMileage}
              placeholder="Örn: 145000"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Fiyat, isteğe bağlı</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="Örn: 875000"
              placeholderTextColor="#6b7280"
              keyboardType="numeric"
            />

            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Seçilen Araç</Text>
              <Text style={styles.previewText}>
                {selectedTitle || "Araç bilgileri seçiliyor..."}
              </Text>
              <Text style={styles.previewSubText}>
                {fuelType ? `Yakıt: ${fuelType}` : "Yakıt tipi belirtilmedi"}
                {transmission ? ` · Şanzıman: ${transmission}` : ""}
              </Text>
            </View>

            <AppButton
              title="Piyasa Değerini Gör"
              onPress={handleResearch}
              disabled={!isFormValid}
              style={{ marginTop: 4 }}
            />
          </>
        )}

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
  warningCard: {
    backgroundColor: "#292524",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#57534e",
    marginBottom: 16,
  },
  warningText: {
    color: "#facc15",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
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
  label: {
    color: "#e5e7eb",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#1f2937",
    color: "#ffffff",
    paddingHorizontal: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#374151",
    marginBottom: 8,
  },
  previewCard: {
    backgroundColor: "#1f2937",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#374151",
    marginTop: 12,
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