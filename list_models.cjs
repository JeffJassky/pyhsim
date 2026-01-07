const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
let apiKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
  if (match) {
    apiKey = match[1].trim();
  }
} catch (e) {
  console.error("Error reading .env.local:", e);
}

if (!apiKey || apiKey === 'your_gemini_key_here') {
  console.error("Invalid or missing API Key");
  process.exit(1);
}

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.models) {
      console.log("Available Models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
           console.log(`- ${m.name}`);
        }
      });
    } else {
      console.log("No models found or error:", data);
    }
  } catch (e) {
    console.error("Error fetching models:", e);
  }
}

listModels();