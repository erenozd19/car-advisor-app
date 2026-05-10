import type { VehicleReport } from "../constants/mockReport";
import type { VehicleInput } from "./generateVehicleReport";

export async function requestVehicleReportFromAI(
  vehicle: VehicleInput
): Promise<VehicleReport> {
  /*
    DİKKAT:
    OpenAI API key mobil uygulamanın içine konmaz.
    Bu fonksiyon ileride bizim backend endpointimize istek atacak.

    Örnek:
    const response = await fetch("https://bizim-api.com/generate-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vehicle),
    });

    const data = await response.json();
    return data.report;
  */

  throw new Error("AI backend henüz bağlanmadı.");
}