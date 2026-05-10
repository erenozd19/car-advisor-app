import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { VehicleReport } from "../constants/mockReport";

export type SavedReport = {
  id: string;
  title: string;
  createdAt: string;
  vehicle: {
    brand: string;
    model: string;
    year: string;
    engine: string;
    fuelType?: string;
    transmission?: string;
    mileage: string;
    price: string;
    damageInfo?: string;
  };
  report: VehicleReport;
};

type ReportStore = {
  currentReport: VehicleReport | null;
  savedReports: SavedReport[];
  setCurrentReport: (report: VehicleReport) => void;
  addSavedReport: (report: SavedReport) => void;
  clearCurrentReport: () => void;
  clearSavedReports: () => void;
};

export const useReportStore = create<ReportStore>()(
  persist(
    (set) => ({
      currentReport: null,
      savedReports: [],

      setCurrentReport: (report) => set({ currentReport: report }),

      addSavedReport: (report) =>
        set((state) => ({
          savedReports: [report, ...state.savedReports],
        })),

      clearCurrentReport: () => set({ currentReport: null }),

      clearSavedReports: () => set({ savedReports: [] }),
    }),
    {
      name: "vehicle-report-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        savedReports: state.savedReports,
      }),
    }
  )
);
