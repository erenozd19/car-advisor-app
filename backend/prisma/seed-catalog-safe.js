require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL is missing in .env");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const SOURCE_NAME = "Manual catalog seed";

const catalog = [
  {
    brand: "Fiat",
    models: [
      {
        name: "Egea",
        generations: [
          {
            name: "Egea Sedan",
            startYear: 2015,
            endYear: null,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.3 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.3",
                powerHp: 95,
                torqueNm: 200,
                transmissions: ["Manuel"],
                packages: ["Easy", "Easy Plus", "Urban", "Lounge", "Mirror", "Street"],
              },
              {
                label: "1.4 Fire",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 95,
                torqueNm: 127,
                transmissions: ["Manuel"],
                packages: ["Easy", "Easy Plus", "Urban", "Lounge"],
              },
              {
                label: "1.6 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 120,
                torqueNm: 320,
                transmissions: ["Manuel", "DCT"],
                packages: ["Urban", "Lounge"],
              },
              {
                label: "1.6 E-Torq",
                fuelType: "Benzin",
                engineVolume: "1.6",
                powerHp: 110,
                torqueNm: 152,
                transmissions: ["Otomatik"],
                packages: ["Easy", "Urban", "Lounge"],
              },
            ],
          },
          {
            name: "Egea Cross",
            startYear: 2021,
            endYear: null,
            bodyType: "Crossover",
            engines: [
              {
                label: "1.3 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.3",
                powerHp: 95,
                torqueNm: 200,
                transmissions: ["Manuel"],
                packages: ["Street", "Urban", "Lounge"],
              },
              {
                label: "1.4 Fire",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 95,
                torqueNm: 127,
                transmissions: ["Manuel"],
                packages: ["Street", "Urban"],
              },
              {
                label: "1.6 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 130,
                torqueNm: 320,
                transmissions: ["DCT"],
                packages: ["Urban", "Lounge"],
              },
              {
                label: "1.5 Hybrid",
                fuelType: "Hibrit",
                engineVolume: "1.5",
                powerHp: 130,
                torqueNm: null,
                transmissions: ["Otomatik"],
                packages: ["Urban", "Lounge"],
              },
            ],
          },
          {
            name: "Egea Hatchback",
            startYear: 2016,
            endYear: 2022,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.3 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.3",
                powerHp: 95,
                torqueNm: 200,
                transmissions: ["Manuel"],
                packages: ["Urban", "Lounge"],
              },
              {
                label: "1.4 Fire",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 95,
                torqueNm: 127,
                transmissions: ["Manuel"],
                packages: ["Urban", "Lounge"],
              },
              {
                label: "1.6 Multijet",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 120,
                torqueNm: 320,
                transmissions: ["DCT"],
                packages: ["Urban", "Lounge"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Renault",
    models: [
      {
        name: "Clio",
        generations: [
          {
            name: "Clio 4",
            startYear: 2012,
            endYear: 2019,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.2 16V",
                fuelType: "Benzin",
                engineVolume: "1.2",
                powerHp: 75,
                torqueNm: 107,
                transmissions: ["Manuel"],
                packages: ["Joy", "Touch", "Icon"],
              },
              {
                label: "1.5 dCi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 90,
                torqueNm: 220,
                transmissions: ["Manuel", "EDC"],
                packages: ["Joy", "Touch", "Icon"],
              },
              {
                label: "0.9 TCe",
                fuelType: "Benzin",
                engineVolume: "0.9",
                powerHp: 90,
                torqueNm: 140,
                transmissions: ["Manuel"],
                packages: ["Joy", "Touch", "Icon"],
              },
            ],
          },
          {
            name: "Clio 5",
            startYear: 2019,
            endYear: null,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.0 SCe",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 65,
                torqueNm: 95,
                transmissions: ["Manuel"],
                packages: ["Joy", "Touch"],
              },
              {
                label: "1.0 TCe",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 90,
                torqueNm: 142,
                transmissions: ["Manuel", "X-Tronic"],
                packages: ["Joy", "Touch", "Icon", "Equilibre", "Evolution", "Techno"],
              },
              {
                label: "1.5 Blue dCi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 85,
                torqueNm: 220,
                transmissions: ["Manuel"],
                packages: ["Joy", "Touch", "Icon"],
              },
              {
                label: "E-Tech Hybrid",
                fuelType: "Hibrit",
                engineVolume: "1.6",
                powerHp: 145,
                torqueNm: null,
                transmissions: ["Otomatik"],
                packages: ["Techno", "Esprit Alpine"],
              },
            ],
          },
        ],
      },
      {
        name: "Megane",
        generations: [
          {
            name: "Megane 4 Sedan",
            startYear: 2016,
            endYear: null,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.5 dCi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 110,
                torqueNm: 260,
                transmissions: ["Manuel", "EDC"],
                packages: ["Joy", "Touch", "Icon"],
              },
              {
                label: "1.3 TCe",
                fuelType: "Benzin",
                engineVolume: "1.3",
                powerHp: 140,
                torqueNm: 240,
                transmissions: ["Manuel", "EDC"],
                packages: ["Joy", "Touch", "Icon"],
              },
              {
                label: "1.6 SCe",
                fuelType: "Benzin",
                engineVolume: "1.6",
                powerHp: 115,
                torqueNm: 156,
                transmissions: ["Manuel", "CVT"],
                packages: ["Joy", "Touch"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Toyota",
    models: [
      {
        name: "Corolla",
        generations: [
          {
            name: "E210",
            startYear: 2019,
            endYear: null,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.5 Dynamic Force",
                fuelType: "Benzin",
                engineVolume: "1.5",
                powerHp: 125,
                torqueNm: 153,
                transmissions: ["Manuel", "Multidrive S"],
                packages: ["Vision", "Dream", "Flame", "Passion"],
              },
              {
                label: "1.8 Hybrid",
                fuelType: "Hibrit",
                engineVolume: "1.8",
                powerHp: 122,
                torqueNm: null,
                transmissions: ["e-CVT"],
                packages: ["Dream", "Flame", "Passion"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Honda",
    models: [
      {
        name: "Civic",
        generations: [
          {
            name: "FC5",
            startYear: 2016,
            endYear: 2021,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.6 i-VTEC",
                fuelType: "Benzin",
                engineVolume: "1.6",
                powerHp: 125,
                torqueNm: 152,
                transmissions: ["Manuel", "CVT"],
                packages: ["Elegance", "Executive"],
              },
              {
                label: "1.5 VTEC Turbo",
                fuelType: "Benzin",
                engineVolume: "1.5",
                powerHp: 182,
                torqueNm: 220,
                transmissions: ["CVT"],
                packages: ["Elegance", "Executive"],
              },
            ],
          },
          {
            name: "FE",
            startYear: 2021,
            endYear: null,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.5 VTEC Turbo",
                fuelType: "Benzin",
                engineVolume: "1.5",
                powerHp: 182,
                torqueNm: 240,
                transmissions: ["CVT"],
                packages: ["Elegance", "Executive"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Volkswagen",
    models: [
      {
        name: "Golf",
        generations: [
          {
            name: "Golf 8",
            startYear: 2020,
            endYear: null,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.0 TSI",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 110,
                torqueNm: 200,
                transmissions: ["Manuel"],
                packages: ["Impression", "Life"],
              },
              {
                label: "1.5 TSI",
                fuelType: "Benzin",
                engineVolume: "1.5",
                powerHp: 150,
                torqueNm: 250,
                transmissions: ["Manuel", "DSG"],
                packages: ["Life", "Style", "R-Line"],
              },
              {
                label: "1.0 eTSI",
                fuelType: "Benzin Mild Hybrid",
                engineVolume: "1.0",
                powerHp: 110,
                torqueNm: 200,
                transmissions: ["DSG"],
                packages: ["Life", "Style"],
              },
              {
                label: "1.5 eTSI",
                fuelType: "Benzin Mild Hybrid",
                engineVolume: "1.5",
                powerHp: 150,
                torqueNm: 250,
                transmissions: ["DSG"],
                packages: ["Style", "R-Line"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Ford",
    models: [
      {
        name: "Focus",
        generations: [
          {
            name: "Focus Mk3",
            startYear: 2011,
            endYear: 2018,
            bodyType: "Sedan/Hatchback",
            engines: [
              {
                label: "1.6 TDCi",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 95,
                torqueNm: 230,
                transmissions: ["Manuel"],
                packages: ["Trend X", "Style", "Titanium"],
              },
              {
                label: "1.6 Ti-VCT",
                fuelType: "Benzin",
                engineVolume: "1.6",
                powerHp: 125,
                torqueNm: 159,
                transmissions: ["Manuel", "Powershift"],
                packages: ["Trend X", "Style", "Titanium"],
              },
            ],
          },
          {
            name: "Focus Mk4",
            startYear: 2018,
            endYear: null,
            bodyType: "Sedan/Hatchback",
            engines: [
              {
                label: "1.5 EcoBlue",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 120,
                torqueNm: 300,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Trend X", "Titanium", "ST-Line"],
              },
              {
                label: "1.0 EcoBoost",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 125,
                torqueNm: 170,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Trend X", "Titanium", "ST-Line"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Hyundai",
    models: [
      {
        name: "i20",
        generations: [
          {
            name: "i20 GB",
            startYear: 2014,
            endYear: 2020,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.2 MPI",
                fuelType: "Benzin",
                engineVolume: "1.2",
                powerHp: 84,
                torqueNm: 122,
                transmissions: ["Manuel"],
                packages: ["Jump", "Style", "Elite"],
              },
              {
                label: "1.4 MPI",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 100,
                torqueNm: 134,
                transmissions: ["Otomatik"],
                packages: ["Style", "Elite"],
              },
            ],
          },
          {
            name: "i20 BC3",
            startYear: 2020,
            endYear: null,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.4 MPI",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 100,
                torqueNm: 134,
                transmissions: ["Otomatik"],
                packages: ["Jump", "Style", "Elite"],
              },
              {
                label: "1.0 T-GDI",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 100,
                torqueNm: 172,
                transmissions: ["DCT"],
                packages: ["Style", "Elite"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Opel",
    models: [
      {
        name: "Astra",
        generations: [
          {
            name: "Astra J",
            startYear: 2009,
            endYear: 2016,
            bodyType: "Hatchback/Sedan",
            engines: [
              {
                label: "1.6 CDTI",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 136,
                torqueNm: 320,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Edition", "Enjoy", "Sport", "Cosmo"],
              },
              {
                label: "1.4 Turbo",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 140,
                torqueNm: 200,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Edition", "Enjoy", "Sport", "Cosmo"],
              },
            ],
          },
          {
            name: "Astra K",
            startYear: 2015,
            endYear: 2021,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.6 CDTI",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 136,
                torqueNm: 320,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Dynamic", "Enjoy", "Excellence"],
              },
              {
                label: "1.4 Turbo",
                fuelType: "Benzin",
                engineVolume: "1.4",
                powerHp: 150,
                torqueNm: 245,
                transmissions: ["Manuel", "Otomatik"],
                packages: ["Dynamic", "Enjoy", "Excellence"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Dacia",
    models: [
      {
        name: "Duster",
        generations: [
          {
            name: "Duster 2",
            startYear: 2018,
            endYear: 2024,
            bodyType: "SUV",
            engines: [
              {
                label: "1.0 TCe",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 100,
                torqueNm: 160,
                transmissions: ["Manuel"],
                packages: ["Comfort", "Prestige", "Journey"],
              },
              {
                label: "1.3 TCe",
                fuelType: "Benzin",
                engineVolume: "1.3",
                powerHp: 150,
                torqueNm: 250,
                transmissions: ["EDC"],
                packages: ["Comfort", "Prestige", "Journey"],
              },
              {
                label: "1.5 Blue dCi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 115,
                torqueNm: 260,
                transmissions: ["Manuel"],
                packages: ["Comfort", "Prestige", "Journey"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Nissan",
    models: [
      {
        name: "Qashqai",
        generations: [
          {
            name: "J11",
            startYear: 2014,
            endYear: 2021,
            bodyType: "SUV",
            engines: [
              {
                label: "1.5 dCi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 110,
                torqueNm: 260,
                transmissions: ["Manuel", "X-Tronic"],
                packages: ["Visia", "Tekna", "Platinum", "Sky Pack"],
              },
              {
                label: "1.2 DIG-T",
                fuelType: "Benzin",
                engineVolume: "1.2",
                powerHp: 115,
                torqueNm: 190,
                transmissions: ["Manuel", "X-Tronic"],
                packages: ["Visia", "Tekna", "Platinum", "Sky Pack"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Peugeot",
    models: [
      {
        name: "3008",
        generations: [
          {
            name: "P84",
            startYear: 2016,
            endYear: null,
            bodyType: "SUV",
            engines: [
              {
                label: "1.5 BlueHDi",
                fuelType: "Dizel",
                engineVolume: "1.5",
                powerHp: 130,
                torqueNm: 300,
                transmissions: ["EAT8"],
                packages: ["Active", "Allure", "GT Line", "GT"],
              },
              {
                label: "1.6 PureTech",
                fuelType: "Benzin",
                engineVolume: "1.6",
                powerHp: 180,
                torqueNm: 250,
                transmissions: ["EAT8"],
                packages: ["Allure", "GT Line", "GT"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Seat",
    models: [
      {
        name: "Leon",
        generations: [
          {
            name: "Leon Mk3",
            startYear: 2012,
            endYear: 2020,
            bodyType: "Hatchback",
            engines: [
              {
                label: "1.2 TSI",
                fuelType: "Benzin",
                engineVolume: "1.2",
                powerHp: 110,
                torqueNm: 175,
                transmissions: ["Manuel", "DSG"],
                packages: ["Style", "FR"],
              },
              {
                label: "1.6 TDI",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 115,
                torqueNm: 250,
                transmissions: ["Manuel", "DSG"],
                packages: ["Style", "FR"],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Skoda",
    models: [
      {
        name: "Octavia",
        generations: [
          {
            name: "Octavia Mk3",
            startYear: 2013,
            endYear: 2020,
            bodyType: "Sedan",
            engines: [
              {
                label: "1.0 TSI",
                fuelType: "Benzin",
                engineVolume: "1.0",
                powerHp: 115,
                torqueNm: 200,
                transmissions: ["Manuel", "DSG"],
                packages: ["Optimal", "Style", "Prestige"],
              },
              {
                label: "1.6 TDI",
                fuelType: "Dizel",
                engineVolume: "1.6",
                powerHp: 115,
                torqueNm: 250,
                transmissions: ["Manuel", "DSG"],
                packages: ["Optimal", "Style", "Prestige"],
              },
            ],
          },
        ],
      },
    ],
  },
];

function normalize(value) {
  return String(value || "").trim();
}

async function ensureBrand(name) {
  const cleanName = normalize(name);

  return prisma.brand.upsert({
    where: { name: cleanName },
    update: {},
    create: { name: cleanName },
  });
}

async function ensureVehicleModel(brandId, name) {
  const cleanName = normalize(name);

  return prisma.vehicleModel.upsert({
    where: {
      brandId_name: {
        brandId,
        name: cleanName,
      },
    },
    update: {},
    create: {
      brandId,
      name: cleanName,
    },
  });
}

async function ensureGeneration(modelId, generation) {
  const existing = await prisma.generation.findFirst({
    where: {
      modelId,
      name: normalize(generation.name),
      bodyType: generation.bodyType || null,
    },
  });

  if (existing) {
    return prisma.generation.update({
      where: { id: existing.id },
      data: {
        startYear: generation.startYear ?? existing.startYear,
        endYear: generation.endYear ?? existing.endYear,
        bodyType: generation.bodyType ?? existing.bodyType,
      },
    });
  }

  return prisma.generation.create({
    data: {
      modelId,
      name: normalize(generation.name),
      startYear: generation.startYear ?? null,
      endYear: generation.endYear ?? null,
      bodyType: generation.bodyType ?? null,
    },
  });
}

async function ensureEngine(generationId, engine) {
  const existing = await prisma.engineOption.findFirst({
    where: {
      generationId,
      label: normalize(engine.label),
      fuelType: engine.fuelType || null,
      engineVolume: engine.engineVolume || null,
      powerHp: engine.powerHp ?? null,
    },
  });

  const data = {
    label: normalize(engine.label),
    fuelType: engine.fuelType ?? null,
    engineVolume: engine.engineVolume ?? null,
    powerHp: engine.powerHp ?? null,
    torqueNm: engine.torqueNm ?? null,
    sourceName: SOURCE_NAME,
    specs: {
      commonPackages: engine.packages || [],
      seedNote: "Turkey-focused manual catalog seed. Verify trim/year details before production-critical use.",
    },
  };

  if (existing) {
    return prisma.engineOption.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.engineOption.create({
    data: {
      generationId,
      ...data,
    },
  });
}

async function ensureTransmission(engineId, label) {
  const cleanLabel = normalize(label);

  return prisma.transmissionOption.upsert({
    where: {
      engineId_label: {
        engineId,
        label: cleanLabel,
      },
    },
    update: {},
    create: {
      engineId,
      label: cleanLabel,
    },
  });
}

async function main() {
  console.log("Safe vehicle catalog seed started...");

  const summary = {
    brands: 0,
    models: 0,
    generations: 0,
    engines: 0,
    transmissions: 0,
  };

  for (const brandItem of catalog) {
    const brand = await ensureBrand(brandItem.brand);
    summary.brands++;

    for (const modelItem of brandItem.models) {
      const model = await ensureVehicleModel(brand.id, modelItem.name);
      summary.models++;

      for (const generationItem of modelItem.generations) {
        const generation = await ensureGeneration(model.id, generationItem);
        summary.generations++;

        for (const engineItem of generationItem.engines) {
          const engine = await ensureEngine(generation.id, engineItem);
          summary.engines++;

          for (const transmissionLabel of engineItem.transmissions || []) {
            await ensureTransmission(engine.id, transmissionLabel);
            summary.transmissions++;
          }
        }
      }
    }
  }

  console.log("Safe vehicle catalog seed completed:", summary);
}

main()
  .catch((error) => {
    console.error("Safe catalog seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });