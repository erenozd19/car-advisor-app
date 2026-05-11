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

async function main() {
  console.log("Seeding vehicle catalog...");

  await prisma.brand.deleteMany();

  const vw = await prisma.brand.create({
    data: {
      name: "Volkswagen",
      models: {
        create: [
          {
            name: "Golf",
            generations: {
              create: [
                {
                  name: "Golf 7",
                  startYear: 2013,
                  endYear: 2020,
                  bodyType: "Hatchback",
                  engines: {
                    create: [
                      {
                        label: "1.2 TSI",
                        fuelType: "Benzin",
                        engineVolume: "1.2",
                        powerHp: 105,
                        torqueNm: 175,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "DSG" }],
                        },
                      },
                      {
                        label: "1.4 TSI",
                        fuelType: "Benzin",
                        engineVolume: "1.4",
                        powerHp: 125,
                        torqueNm: 200,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "DSG" }],
                        },
                      },
                      {
                        label: "1.6 TDI",
                        fuelType: "Dizel",
                        engineVolume: "1.6",
                        powerHp: 115,
                        torqueNm: 250,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "DSG" }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Passat",
            generations: {
              create: [
                {
                  name: "B8",
                  startYear: 2015,
                  endYear: 2023,
                  bodyType: "Sedan",
                  engines: {
                    create: [
                      {
                        label: "1.4 TSI",
                        fuelType: "Benzin",
                        engineVolume: "1.4",
                        powerHp: 125,
                        torqueNm: 200,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "DSG" }],
                        },
                      },
                      {
                        label: "1.6 TDI",
                        fuelType: "Dizel",
                        engineVolume: "1.6",
                        powerHp: 120,
                        torqueNm: 250,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "DSG" }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const renault = await prisma.brand.create({
    data: {
      name: "Renault",
      models: {
        create: [
          {
            name: "Clio",
            generations: {
              create: [
                {
                  name: "Clio 4",
                  startYear: 2012,
                  endYear: 2019,
                  bodyType: "Hatchback",
                  engines: {
                    create: [
                      {
                        label: "1.2 16V",
                        fuelType: "Benzin",
                        engineVolume: "1.2",
                        powerHp: 75,
                        torqueNm: 107,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }],
                        },
                      },
                      {
                        label: "1.5 dCi",
                        fuelType: "Dizel",
                        engineVolume: "1.5",
                        powerHp: 90,
                        torqueNm: 220,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "EDC" }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const fiat = await prisma.brand.create({
    data: {
      name: "Fiat",
      models: {
        create: [
          {
            name: "Egea",
            generations: {
              create: [
                {
                  name: "Egea",
                  startYear: 2015,
                  endYear: null,
                  bodyType: "Sedan",
                  engines: {
                    create: [
                      {
                        label: "1.4 Fire",
                        fuelType: "Benzin",
                        engineVolume: "1.4",
                        powerHp: 95,
                        torqueNm: 127,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }],
                        },
                      },
                      {
                        label: "1.3 Multijet",
                        fuelType: "Dizel",
                        engineVolume: "1.3",
                        powerHp: 95,
                        torqueNm: 200,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  const toyota = await prisma.brand.create({
    data: {
      name: "Toyota",
      models: {
        create: [
          {
            name: "Corolla",
            generations: {
              create: [
                {
                  name: "E170 / E180",
                  startYear: 2013,
                  endYear: 2019,
                  bodyType: "Sedan",
                  engines: {
                    create: [
                      {
                        label: "1.33 Dual VVT-i",
                        fuelType: "Benzin",
                        engineVolume: "1.33",
                        powerHp: 99,
                        torqueNm: 128,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }],
                        },
                      },
                      {
                        label: "1.6 Valvematic",
                        fuelType: "Benzin",
                        engineVolume: "1.6",
                        powerHp: 132,
                        torqueNm: 160,
                        sourceName: "Manual seed",
                        transmissions: {
                          create: [{ label: "Manuel" }, { label: "Multidrive S" }],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Seed completed:", {
    vw: vw.name,
    renault: renault.name,
    fiat: fiat.name,
    toyota: toyota.name,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });