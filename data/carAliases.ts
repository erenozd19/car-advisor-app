type AliasResult = {
  brand?: string;
  model?: string;
  message?: string;
};

const knownBrands = [
  "Volkswagen",
  "Renault",
  "Fiat",
  "Toyota",
  "Honda",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Opel",
  "Hyundai",
  "Peugeot",
  "Ford",
  "Seat",
  "Skoda",
  "Nissan",
  "Citroen",
  "Dacia",
  "Kia",
  "Volvo",
];

const knownModels = [
  "Golf",
  "Passat",
  "Polo",
  "Jetta",
  "Clio",
  "Megane",
  "Symbol",
  "Egea",
  "Linea",
  "Corolla",
  "Civic",
  "Focus",
  "Fiesta",
  "Astra",
  "Corsa",
  "i20",
  "i30",
  "308",
  "301",
  "C180",
  "320i",
  "A3",
  "A4",
  "Leon",
  "Octavia",
  "Superb",
];

const brandAliases: Record<string, string> = {
  ww: "Volkswagen",
  wv: "Volkswagen",
  vw: "Volkswagen",
  volkswagn: "Volkswagen",
  wolksvagen: "Volkswagen",
  wosvagen: "Volkswagen",
  vosvagen: "Volkswagen",
  vosvogen: "Volkswagen",

  mercedes: "Mercedes-Benz",
  mersedes: "Mercedes-Benz",
  merco: "Mercedes-Benz",

  bmw: "BMW",
  beemve: "BMW",

  reno: "Renault",
  rönö: "Renault",
  renolt: "Renault",

  pejo: "Peugeot",
  pejoğ: "Peugeot",

  hundai: "Hyundai",
  hyndai: "Hyundai",
};

const modelAliases: Record<string, string> = {
  glof: "Golf",
  golff: "Golf",
  dolf: "Golf",
  "golf 7": "Golf",
  "golf mk7": "Golf",

  pasat: "Passat",
  cilio: "Clio",
  clioo: "Clio",
  megan: "Megane",
  agea: "Egea",
  corola: "Corolla",
  civik: "Civic",
  fokus: "Focus",

  "c 180": "C180",
  "3.20": "320i",
  "320": "320i",
};

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/-/g, "")
    .replace(/\./g, "");
}

function damerauLevenshteinDistance(a: string, b: string) {
  const source = normalizeText(a);
  const target = normalizeText(b);

  const sourceLength = source.length;
  const targetLength = target.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= sourceLength; i++) {
    matrix[i] = [];
    matrix[i][0] = i;
  }

  for (let j = 0; j <= targetLength; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= sourceLength; i++) {
    for (let j = 1; j <= targetLength; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        source[i - 1] === target[j - 2] &&
        source[i - 2] === target[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[sourceLength][targetLength];
}

function similarity(input: string, target: string) {
  const normalizedInput = normalizeText(input);
  const normalizedTarget = normalizeText(target);

  const longestLength = Math.max(
    normalizedInput.length,
    normalizedTarget.length
  );

  if (longestLength === 0) return 0;

  const distance = damerauLevenshteinDistance(normalizedInput, normalizedTarget);

  return 1 - distance / longestLength;
}

function findClosestMatch(input: string, options: string[], minScore = 0.62) {
  if (!input.trim()) return null;

  const normalizedInput = normalizeText(input);

  let bestMatch: string | null = null;
  let bestScore = 0;
  let bestDistance = Infinity;

  for (const option of options) {
    const normalizedOption = normalizeText(option);
    const score = similarity(normalizedInput, normalizedOption);
    const distance = damerauLevenshteinDistance(
      normalizedInput,
      normalizedOption
    );

    if (score > bestScore) {
      bestScore = score;
      bestMatch = option;
      bestDistance = distance;
    }
  }

  if (!bestMatch) return null;

  // Kısa model adlarında skor düşük çıkabilir. Örnek: dlof -> Golf.
  // Bu yüzden kısa kelimelerde mesafe bazlı tolerans veriyoruz.
  if (normalizedInput.length <= 4 && bestDistance <= 2) {
    return bestMatch;
  }

  if (normalizedInput.length <= 6 && bestDistance <= 2) {
    return bestMatch;
  }

  if (bestScore >= minScore) {
    return bestMatch;
  }

  return null;
}

export function getVehicleAliasSuggestion(
  brand: string,
  model: string
): AliasResult | null {
  const normalizedBrand = normalizeText(brand);
  const normalizedModel = normalizeText(model);

  const aliasBrand = brandAliases[normalizedBrand];
  const aliasModel = modelAliases[normalizedModel];

  const fuzzyBrand = aliasBrand || findClosestMatch(brand, knownBrands, 0.55);
  const fuzzyModel = aliasModel || findClosestMatch(model, knownModels, 0.55);

  const brandAlreadyCorrect =
    fuzzyBrand && normalizeText(fuzzyBrand) === normalizedBrand;

  const modelAlreadyCorrect =
    fuzzyModel && normalizeText(fuzzyModel) === normalizedModel;

  const suggestedBrand = brandAlreadyCorrect ? undefined : fuzzyBrand || undefined;
  const suggestedModel = modelAlreadyCorrect ? undefined : fuzzyModel || undefined;

  if (!suggestedBrand && !suggestedModel) {
    return null;
  }

  const parts: string[] = [];

  if (suggestedBrand) {
    parts.push(`Marka için "${suggestedBrand}" demek istemiş olabilirsin.`);
  }

  if (suggestedModel) {
    parts.push(`Model için "${suggestedModel}" demek istemiş olabilirsin.`);
  }

  return {
    brand: suggestedBrand,
    model: suggestedModel,
    message: parts.join(" "),
  };
}