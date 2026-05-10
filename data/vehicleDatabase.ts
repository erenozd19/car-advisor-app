export type VehicleEngineOption = {
  name: string;
  fuelType: string;
  transmissions: string[];
};

export type VehicleModelOption = {
  name: string;
  years: number[];
  engines: VehicleEngineOption[];
};

export type VehicleBrandOption = {
  name: string;
  models: VehicleModelOption[];
};

export const vehicleDatabase: VehicleBrandOption[] = [
  {
    name: "Volkswagen",
    models: [
      {
        name: "Golf",
        years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
        engines: [
          {
            name: "1.2 TSI",
            fuelType: "Benzin",
            transmissions: ["Manuel", "DSG"],
          },
          {
            name: "1.4 TSI",
            fuelType: "Benzin",
            transmissions: ["Manuel", "DSG"],
          },
          {
            name: "1.6 TDI",
            fuelType: "Dizel",
            transmissions: ["Manuel", "DSG"],
          },
        ],
      },
      {
        name: "Passat",
        years: [2015, 2016, 2017, 2018, 2019, 2020],
        engines: [
          {
            name: "1.4 TSI",
            fuelType: "Benzin",
            transmissions: ["Manuel", "DSG"],
          },
          {
            name: "1.6 TDI",
            fuelType: "Dizel",
            transmissions: ["DSG"],
          },
          {
            name: "2.0 TDI",
            fuelType: "Dizel",
            transmissions: ["DSG"],
          },
        ],
      },
    ],
  },
  {
    name: "Renault",
    models: [
      {
        name: "Clio",
        years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
        engines: [
          {
            name: "1.2 Benzin",
            fuelType: "Benzin",
            transmissions: ["Manuel"],
          },
          {
            name: "1.5 dCi",
            fuelType: "Dizel",
            transmissions: ["Manuel", "EDC"],
          },
          {
            name: "1.0 TCe",
            fuelType: "Benzin",
            transmissions: ["Manuel", "Otomatik"],
          },
        ],
      },
      {
        name: "Megane",
        years: [2016, 2017, 2018, 2019, 2020, 2021],
        engines: [
          {
            name: "1.5 dCi",
            fuelType: "Dizel",
            transmissions: ["Manuel", "EDC"],
          },
          {
            name: "1.3 TCe",
            fuelType: "Benzin",
            transmissions: ["Manuel", "EDC"],
          },
        ],
      },
    ],
  },
  {
    name: "Fiat",
    models: [
      {
        name: "Egea",
        years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
        engines: [
          {
            name: "1.4 Fire",
            fuelType: "Benzin",
            transmissions: ["Manuel"],
          },
          {
            name: "1.3 Multijet",
            fuelType: "Dizel",
            transmissions: ["Manuel"],
          },
          {
            name: "1.6 Multijet",
            fuelType: "Dizel",
            transmissions: ["Manuel", "DCT"],
          },
        ],
      },
    ],
  },
  {
    name: "Toyota",
    models: [
      {
        name: "Corolla",
        years: [2016, 2017, 2018, 2019, 2020, 2021, 2022],
        engines: [
          {
            name: "1.6 Valvematic",
            fuelType: "Benzin",
            transmissions: ["Manuel", "CVT"],
          },
          {
            name: "1.8 Hybrid",
            fuelType: "Hibrit",
            transmissions: ["CVT"],
          },
        ],
      },
    ],
  },
  {
    name: "Honda",
    models: [
      {
        name: "Civic",
        years: [2016, 2017, 2018, 2019, 2020, 2021],
        engines: [
          {
            name: "1.6 i-VTEC",
            fuelType: "Benzin",
            transmissions: ["Manuel", "Otomatik"],
          },
          {
            name: "1.5 VTEC Turbo",
            fuelType: "Benzin",
            transmissions: ["CVT"],
          },
        ],
      },
    ],
  },
];