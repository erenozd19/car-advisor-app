const { spawnSync } = require("child_process");
const path = require("path");

const rootDir = path.join(__dirname, "..", "..");

const targets = [
  {
    brand: "Volkswagen",
    model: "Golf",
    url: "https://www.ultimatespecs.com/car-specs/Volkswagen-models/Volkswagen-Golf",
  },
  {
    brand: "Volkswagen",
    model: "Passat",
    url: "https://www.ultimatespecs.com/car-specs/Volkswagen-models/Volkswagen-Passat",
  },
  {
    brand: "Renault",
    model: "Clio",
    url: "https://www.ultimatespecs.com/car-specs/Renault-models/Renault-Clio",
  },
  {
    brand: "Renault",
    model: "Megane",
    url: "https://www.ultimatespecs.com/car-specs/Renault-models/Renault-Megane",
  },
  {
    brand: "Toyota",
    model: "Corolla",
    url: "https://www.ultimatespecs.com/car-specs/Toyota-models/Toyota-Corolla",
  },
  {
    brand: "Honda",
    model: "Civic",
    url: "https://www.ultimatespecs.com/car-specs/Honda-models/Honda-Civic",
  },
  {
    brand: "Ford",
    model: "Focus",
    url: "https://www.ultimatespecs.com/car-specs/Ford-models/Ford-Focus",
  },
  {
    brand: "Hyundai",
    model: "i20",
    url: "https://www.ultimatespecs.com/car-specs/Hyundai-models/Hyundai-i20",
  },
  {
    brand: "Hyundai",
    model: "i30",
    url: "https://www.ultimatespecs.com/car-specs/Hyundai-models/Hyundai-i30",
  },
  {
    brand: "Opel",
    model: "Astra",
    url: "https://www.ultimatespecs.com/car-specs/Opel-models/Opel-Astra",
  },
  {
    brand: "Dacia",
    model: "Duster",
    url: "https://www.ultimatespecs.com/car-specs/Dacia-models/Dacia-Duster",
  },
  {
    brand: "Nissan",
    model: "Qashqai",
    url: "https://www.ultimatespecs.com/car-specs/Nissan-models/Nissan-Qashqai",
  },
  {
    brand: "Peugeot",
    model: "3008",
    url: "https://www.ultimatespecs.com/car-specs/Peugeot-models/Peugeot-3008",
  },
  {
    brand: "Seat",
    model: "Leon",
    url: "https://www.ultimatespecs.com/car-specs/Seat-models/Seat-Leon",
  },
  {
    brand: "Skoda",
    model: "Octavia",
    url: "https://www.ultimatespecs.com/car-specs/Skoda-models/Skoda-Octavia",
  },
  {
    brand: "Fiat",
    model: "Egea",
    url: "https://www.ultimatespecs.com/car-specs/Fiat-models/Fiat-Egea",
  },
];

function safeFilePart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });

  return result.status === 0;
}

async function main() {
  console.log(`Batch vehicle import started. Target count: ${targets.length}`);

  const summary = {
    success: [],
    failed: [],
  };

  for (const target of targets) {
    console.log("\n======================================");
    console.log(`Scraping: ${target.brand} ${target.model}`);
    console.log("======================================");

    const scrapeOk = run("node", [
      "backend/scripts/scrapeUltimateSpecsModel.js",
      `"${target.brand}"`,
      `"${target.model}"`,
      `"${target.url}"`,
    ]);

    if (!scrapeOk) {
      console.error(`Scrape failed: ${target.brand} ${target.model}`);
      summary.failed.push({
        ...target,
        step: "scrape",
      });
      continue;
    }

    const fileName = `vehicleCatalog.ultimatespecs.${safeFilePart(
      target.brand
    )}.${safeFilePart(target.model)}.json`;

    console.log("\n--------------------------------------");
    console.log(`Importing: ${fileName}`);
    console.log("--------------------------------------");

    const importOk = run("node", [
      "backend/scripts/importVehicleCatalog.js",
      fileName,
    ]);

    if (!importOk) {
      console.error(`Import failed: ${target.brand} ${target.model}`);
      summary.failed.push({
        ...target,
        step: "import",
      });
      continue;
    }

    summary.success.push(target);
  }

  console.log("\nBatch vehicle import completed.");
  console.log("Success:", summary.success.map((x) => `${x.brand} ${x.model}`));
  console.log("Failed:", summary.failed);
}

main().catch((error) => {
  console.error("Batch vehicle import fatal error:", error);
  process.exit(1);
});