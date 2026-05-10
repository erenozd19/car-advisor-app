require("dotenv").config();

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  const usableModels = data.models
    .filter((model) => model.supportedGenerationMethods?.includes("generateContent"))
    .map((model) => ({
      name: model.name,
      displayName: model.displayName,
    }));

  console.log(JSON.stringify(usableModels, null, 2));
}

listModels();