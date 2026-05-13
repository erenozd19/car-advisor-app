const fs = require("fs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

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

const inputFileName = process.argv[2] || "vehicleCatalog.sample.json";

const catalogPath = path.join(
  __dirname,
  "..",
  "data",
  "import",
  inputFileName
);
function readCatalog() {
  if (!fs.existsSync(catalogPath)) {
    throw new Error(`Catalog file not found: ${catalogPath}`);
  }

  console.log(`Reading catalog file: ${catalogPath}`);

  const raw = fs.readFileSync(catalogPath, "utf-8");
  return JSON.parse(raw);
}

async function upsertTransmission(engineId, label) {
  return prisma.transmissionOption.upsert({
    where: {
      engineId_label: {
        engineId,
        label,
      },
    },
    update: {},
    create: {
      engineId,
      label,
    },
  });
}

async function importCatalog() {
  const catalog = readCatalog();

  console.log(`Import started. Brand count: ${catalog.length}`);

  let brandCount = 0;
  let modelCount = 0;
  let generationCount = 0;
  let engineCount = 0;
  let transmissionCount = 0;

  for (const brandItem of catalog) {
    const brand = await prisma.brand.upsert({
      where: {
        name: brandItem.brand,
      },
      update: {},
      create: {
        name: brandItem.brand,
      },
    });

    brandCount += 1;

    for (const modelItem of brandItem.models || []) {
      const model = await prisma.vehicleModel.upsert({
        where: {
          brandId_name: {
            brandId: brand.id,
            name: modelItem.name,
          },
        },
        update: {},
        create: {
          brandId: brand.id,
          name: modelItem.name,
        },
      });

      modelCount += 1;

      for (const generationItem of modelItem.generations || []) {
        const existingGeneration = await prisma.generation.findFirst({
          where: {
            modelId: model.id,
            name: generationItem.name,
            startYear: generationItem.startYear ?? null,
            endYear: generationItem.endYear ?? null,
          },
        });

        const generation = existingGeneration
          ? await prisma.generation.update({
              where: {
                id: existingGeneration.id,
              },
              data: {
                bodyType: generationItem.bodyType || null,
              },
            })
          : await prisma.generation.create({
              data: {
                modelId: model.id,
                name: generationItem.name,
                startYear: generationItem.startYear ?? null,
                endYear: generationItem.endYear ?? null,
                bodyType: generationItem.bodyType || null,
              },
            });

        generationCount += 1;

        for (const engineItem of generationItem.engines || []) {
          const existingEngine = await prisma.engineOption.findFirst({
            where: {
              generationId: generation.id,
              label: engineItem.label,
              fuelType: engineItem.fuelType || null,
              engineVolume: engineItem.engineVolume || null,
            },
          });

          const engineData = {
            generationId: generation.id,
            label: engineItem.label,
            fuelType: engineItem.fuelType || null,
            engineVolume: engineItem.engineVolume || null,
            powerHp: engineItem.powerHp ?? null,
            torqueNm: engineItem.torqueNm ?? null,
            sourceName: engineItem.sourceName || "Import",
            sourceUrl: engineItem.sourceUrl || null,
            specs: engineItem.specs || null,
          };

          const engine = existingEngine
            ? await prisma.engineOption.update({
                where: {
                  id: existingEngine.id,
                },
                data: engineData,
              })
            : await prisma.engineOption.create({
                data: engineData,
              });

          engineCount += 1;

          for (const transmissionLabel of engineItem.transmissions || []) {
            await upsertTransmission(engine.id, transmissionLabel);
            transmissionCount += 1;
          }
        }
      }
    }
  }

  console.log("Import completed.");
  console.table({
    brands: brandCount,
    models: modelCount,
    generations: generationCount,
    engines: engineCount,
    transmissions: transmissionCount,
  });
}

importCatalog()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });