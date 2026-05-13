const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE_URL = "https://www.ultimatespecs.com";

const TARGET = {
  brand: process.argv[2],
  model: process.argv[3],
  modelUrl: process.argv[4],
};

if (!TARGET.brand || !TARGET.model || !TARGET.modelUrl) {
  throw new Error(
    "Usage: node backend/scripts/scrapeUltimateSpecsModel.js <Brand> <Model> <UltimateSpecsModelUrl>"
  );
}

const safeBrand = TARGET.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const safeModel = TARGET.model.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const outputPath = path.join(
  __dirname,
  "..",
  "data",
  "import",
  `vehicleCatalog.ultimatespecs.${safeBrand}.${safeModel}.json`
);

function absoluteUrl(href) {
  if (!href) return null;
  if (href.startsWith("http")) return href;
  if (href.startsWith("/")) return `${BASE_URL}${href}`;
  return `${BASE_URL}/${href}`;
}

async function fetchHtml(url) {
  console.log(`Fetching: ${url}`);

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CarAdvisorAppBot/0.1; +local-test)",
      Accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseGenerationHeading(text) {
  const clean = text.replace(/\s+/g, " ").trim();

  const match = clean.match(/^(.+?)\s*\((\d{4})\s*-\s*(Present|\d{4})\)$/i);

  if (!match) {
    return null;
  }

  return {
    name: match[1].trim(),
    startYear: Number(match[2]),
    endYear: match[3].toLowerCase() === "present" ? null : Number(match[3]),
  };
}

function fuelTypeFromSection(sectionTitle) {
  const text = sectionTitle.toLowerCase();

  if (text.includes("diesel")) return "Dizel";
  if (text.includes("petrol")) return "Benzin";
  if (text.includes("electric")) return "Elektrik";
  if (text.includes("hybrid")) return "Hibrit";
  if (text.includes("others")) return "Diğer";

  return null;
}

function detectTransmission(textValue) {
  const text = String(textValue || "").toLowerCase();

  if (text.includes("dsg")) return "DSG";
  if (text.includes("edc")) return "EDC";
  if (text.includes("tiptronic")) return "Tiptronic";
  if (text.includes("x-tronic")) return "X-Tronic";
  if (text.includes("cvt")) return "CVT";
  if (text.includes("automatic")) return "Otomatik";
  if (text.includes("auto")) return "Otomatik";

  return "Manuel";
}

function normalizeEngineLabel(label) {
  return label
    .replace(new RegExp(`^${TARGET.model}\\s+`, "i"), "")
    .replace(/^Variant\s+/i, "")
    .replace(/\b\d+\s*HP\b/gi, "")
    .replace(/\bDSG\b/gi, "")
    .replace(/\bAutomatic\b/gi, "")
    .replace(/\bAuto\b/gi, "")
    .replace(/\bManual\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePowerHp(text) {
  const hpMatch = text.match(/(\d+)\s*hp/i);
  if (hpMatch) return Number(hpMatch[1]);

  const labelHpMatch = text.match(/(\d+)\s*HP/i);
  if (labelHpMatch) return Number(labelHpMatch[1]);

  return null;
}

function parseEngineVolume(text) {
  const literMatch = text.match(/\b(\d\.\d)\b/);

  if (literMatch) {
    return literMatch[1];
  }

  const cm3Match = text.match(/(\d{3,4})\s*cm/i);

  if (!cm3Match) return null;

  const cm3 = Number(cm3Match[1]);

  if (cm3 >= 900 && cm3 < 1100) return "1.0";
  if (cm3 >= 1100 && cm3 < 1300) return "1.2";
  if (cm3 >= 1300 && cm3 < 1500) return "1.4";
  if (cm3 >= 1400 && cm3 < 1600) return "1.5";
  if (cm3 >= 1500 && cm3 < 1700) return "1.6";
  if (cm3 >= 1900 && cm3 < 2100) return "2.0";

  return String(Math.round((cm3 / 1000) * 10) / 10);
}

function parseYearFromRow(text, fallbackStartYear) {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  return yearMatch ? Number(yearMatch[0]) : fallbackStartYear;
}

async function scrapeModelGenerations() {
  const html = await fetchHtml(TARGET.modelUrl);
  const $ = cheerio.load(html);

  const generations = [];

  $("h2").each((_, element) => {
    const headingText = $(element).text();
    const parsed = parseGenerationHeading(headingText);

    if (!parsed) return;

    generations.push({
      ...parsed,
      links: [],
    });
  });

  $("a").each((_, link) => {
    const text = $(link).text().replace(/\s+/g, " ").trim();
    const href = absoluteUrl($(link).attr("href"));

    if (!text || !href) return;

    const lowerText = text.toLowerCase();
    const lowerHref = href.toLowerCase();
    const modelLower = TARGET.model.toLowerCase();

    if (!lowerText.includes("versions")) return;
    if (!lowerText.includes(modelLower)) return;

    if (lowerText.includes("variant")) return;
    if (lowerText.includes("combi")) return;
    if (lowerText.includes("estate")) return;
    if (lowerText.includes("wagon")) return;
    if (lowerText.includes("3-doors")) return;
    if (lowerText.includes("3 doors")) return;
    if (lowerText.includes("cabrio")) return;
    if (lowerText.includes("sportsvan")) return;

    for (const generation of generations) {
      const generationName = generation.name.toLowerCase();
      const linkText = lowerText;

      const isMatch =
        linkText.startsWith(generationName) ||
        linkText.includes(`${generationName} `) ||
        linkText.includes(modelLower);

      if (isMatch) {
        generation.links.push({
          title: text,
          url: href,
        });
      }
    }
  });

  const generationsWithLinks = generations.filter(
    (generation) => generation.links.length > 0
  );

  console.log(
    "Generation links:",
    generationsWithLinks.map((item) => ({
      name: item.name,
      links: item.links.map((link) => link.title),
    }))
  );

  return generationsWithLinks;
}

async function scrapeGenerationEngines(generation) {
  if (!generation.links.length) {
    return [];
  }

  const engines = [];

  for (const generationLink of generation.links) {
    const html = await fetchHtml(generationLink.url);
    const $ = cheerio.load(html);

    let currentFuelType = null;

    $("h1, h2, h3, h4, a").each((_, element) => {
      const tagName = element.tagName?.toLowerCase();
      const text = $(element).text().replace(/\s+/g, " ").trim();

      if (!text) return;

      if (["h1", "h2", "h3", "h4"].includes(tagName)) {
        const detectedFuel = fuelTypeFromSection(text);
        if (detectedFuel) {
          currentFuelType = detectedFuel;
        }
        return;
      }

      if (tagName !== "a") return;

      const href = absoluteUrl($(element).attr("href"));
      const rawLabel = text.replace(/\s+/g, " ").trim();

      if (!href || !rawLabel) return;
      const hrefLower = href.toLowerCase();
const rawLabelLower = rawLabel.toLowerCase();
const brandLower = TARGET.brand.toLowerCase();
const modelLower = TARGET.model.toLowerCase();

const brandLooksRight =
  hrefLower.includes(`/car-specs/${brandLower}/`) ||
  hrefLower.includes(`${brandLower}-`);

const modelLooksRight =
  rawLabelLower.includes(modelLower) ||
  hrefLower.includes(modelLower);

if (!brandLooksRight || !modelLooksRight) return;
      if (rawLabel.toLowerCase().includes("versions")) return;
      if (rawLabel.toLowerCase() === TARGET.model.toLowerCase()) return;

      const rowText = $(element).parent().text().replace(/\s+/g, " ").trim();

      const combinedText = `${rawLabel} ${rowText}`;

      const hasSpecSignal =
        combinedText.toLowerCase().includes("hp") ||
        combinedText.toLowerCase().includes("kw") ||
        combinedText.toLowerCase().includes("cm");

      if (!hasSpecSignal) return;

      let fuelType = currentFuelType;

      const lowerLabel = rawLabel.toLowerCase();

      if (!fuelType) {
        if (
          lowerLabel.includes("tdi") ||
          lowerLabel.includes("gtd") ||
          lowerLabel.includes("diesel")
        ) {
          fuelType = "Dizel";
        } else if (
          lowerLabel.includes("tsi") ||
          lowerLabel.includes("gti") ||
          lowerLabel.includes("tfsi")
        ) {
          fuelType = "Benzin";
        } else if (lowerLabel.includes("e-golf") || lowerLabel.includes("electric")) {
          fuelType = "Elektrik";
        } else if (lowerLabel.includes("hybrid") || lowerLabel.includes("gte")) {
          fuelType = "Hibrit";
        } else {
          fuelType = "Diğer";
        }
      }

      const label = normalizeEngineLabel(rawLabel);
      const transmission = detectTransmission(combinedText);
      const powerHp = parsePowerHp(combinedText);
      const engineVolume = parseEngineVolume(combinedText);
      const year = parseYearFromRow(combinedText, generation.startYear);

      engines.push({
        label,
        fuelType,
        engineVolume,
        powerHp,
        torqueNm: null,
        sourceName: "UltimateSpecs",
        sourceUrl: href,
        specs: {
          importedFrom: "UltimateSpecs test scraper",
          generationPage: generationLink.url,
          generationLinkTitle: generationLink.title,
          rawRowText: rowText,
          detectedYear: year,
          originalLabel: rawLabel,
        },
        transmissions: [transmission],
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`${generation.name}: raw engine candidates found: ${engines.length}`);

  return engines;
}

function mergeSimilarEngines(engines) {
  const map = new Map();

  for (const engine of engines) {
    const cleanLabel = normalizeEngineLabel(engine.label);
    const cleanVolume =
      engine.engineVolume || parseEngineVolume(`${engine.label} ${engine.specs?.rawRowText || ""}`);

    const key = [
      cleanLabel,
      engine.fuelType || "",
      cleanVolume || "",
      engine.powerHp || "",
    ].join("|");

    if (!map.has(key)) {
      map.set(key, {
        ...engine,
        label: cleanLabel,
        engineVolume: cleanVolume,
        transmissions: [...new Set(engine.transmissions)],
      });
      continue;
    }

    const existing = map.get(key);

    existing.transmissions = [
      ...new Set([...existing.transmissions, ...engine.transmissions]),
    ];

    if (!existing.sourceUrl && engine.sourceUrl) {
      existing.sourceUrl = engine.sourceUrl;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const volumeA = Number(a.engineVolume || 99);
    const volumeB = Number(b.engineVolume || 99);

    if (volumeA !== volumeB) return volumeA - volumeB;

    return (a.powerHp || 0) - (b.powerHp || 0);
  });
}

async function main() {
  console.log("UltimateSpecs test scrape started.");

  const generations = await scrapeModelGenerations();

  console.log(
    "Generations found:",
    generations.map((item) => `${item.name} (${item.startYear}-${item.endYear || "Present"})`)
  );

  const selectedGenerations = generations;

  const output = [
    {
      brand: TARGET.brand,
      models: [
        {
          name: TARGET.model,
          generations: [],
        },
      ],
    },
  ];

  for (const generation of selectedGenerations) {
    const engines = await scrapeGenerationEngines(generation);

    output[0].models[0].generations.push({
      name: generation.name,
      startYear: generation.startYear,
      endYear: generation.endYear,
      bodyType: null,
      engines: mergeSimilarEngines(engines),
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  console.log("UltimateSpecs test scrape completed.");
  console.log(`Output written to: ${outputPath}`);

  for (const generation of output[0].models[0].generations) {
    console.log(
      `${generation.name}: ${generation.engines.length} engine rows normalized`
    );
  }
}

main().catch((error) => {
  console.error("UltimateSpecs test scrape failed:", error);
  process.exit(1);
});