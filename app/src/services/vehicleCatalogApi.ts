import { API_BASE_URL } from "../config/api";

export type Brand = {
  id: string;
  name: string;
};

export type VehicleModel = {
  id: string;
  brandId: string;
  name: string;
};

export type Generation = {
  id: string;
  modelId: string;
  name: string;
  startYear: number | null;
  endYear: number | null;
  bodyType: string | null;
};

export type EnginePowerOption = {
  powerHp?: number | null;
  sourceUrl?: string | null;
  sourceName?: string | null;
};

export type EngineOption = {
  id: string;
  generationId: string;
  label: string;
  fuelType?: string | null;
  engineVolume?: string | null;
  powerHp?: number | null;
  torqueNm?: number | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  specs?: any;
  generationName?: string | null;

  powerOptions?: EnginePowerOption[];
  transmissionLabels?: string[];
  sourceUrls?: string[];
};

export type TransmissionOption = {
  id: string;
  engineId: string;
  label: string;
};

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const json = await response.json();

  if (!response.ok || !json.ok) {
    throw new Error(json?.message || "Araç verisi alınamadı.");
  }

  return json.data;
}

export function getBrands() {
  return request<Brand[]>(`${API_BASE_URL}/api/vehicles/brands`);
}

export function getModels(brandId: string) {
  return request<VehicleModel[]>(
    `${API_BASE_URL}/api/vehicles/models?brandId=${encodeURIComponent(brandId)}`
  );
}

export function getGenerations(modelId: string) {
  return request<Generation[]>(
    `${API_BASE_URL}/api/vehicles/generations?modelId=${encodeURIComponent(modelId)}`
  );
}

export function getEngines(generationId: string) {
  return request<EngineOption[]>(
    `${API_BASE_URL}/api/vehicles/engines?generationId=${encodeURIComponent(generationId)}`
  );
}

export function getTransmissions(engineId: string) {
  return request<TransmissionOption[]>(
    `${API_BASE_URL}/api/vehicles/transmissions?engineId=${encodeURIComponent(engineId)}`
  );
}

export function getYears(modelId: string) {
  return request<string[]>(
    `${API_BASE_URL}/api/vehicles/years?modelId=${encodeURIComponent(modelId)}`
  );
}

export function getEnginesByModelYear(modelId: string, year: string) {
  return request<EngineOption[]>(
    `${API_BASE_URL}/api/vehicles/engines-by-model-year?modelId=${encodeURIComponent(
      modelId
    )}&year=${encodeURIComponent(year)}`
  );
}