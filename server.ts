import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Shared Gemini Client Helper (Lazy-initialized inside routes)
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Proxy: Open-Meteo Geocoding API
  app.get("/api/geocode", async (req, res) => {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: "Missing city name parameter." });
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(String(name))}&count=6&language=en&format=json`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo Geocoding API returned status code ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Geocoding proxy fetch failed:", err);
      res.status(500).json({ error: err.message || "Failed to search coordinates for specified city." });
    }
  });

  // API Proxy: Open-Meteo Forecast API
  app.get("/api/forecast", async (req, res) => {
    const { latitude, longitude } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing latitude or longitude parameters." });
    }
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Open-Meteo Forecast API returned status code ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      console.error("Forecast proxy fetch failed:", err);
      res.status(500).json({ error: err.message || "Failed to fetch meteorological weather data." });
    }
  });

  // API Route: Weather recommendations (Gemini Powered)
  app.post("/api/recommendations", async (req, res) => {
    const { city, current, daily } = req.body;

    if (!city || !current || !daily) {
      return res.status(400).json({ error: "Missing required weather parameters (city, current, daily)." });
    }

    try {
      const hasApiKey = !!process.env.GEMINI_API_KEY;

      if (!hasApiKey) {
        // Fallback to high-quality static rule-based recommendations if no API Key is provided
        console.warn("GEMINI_API_KEY is not defined. Falling back to rule-based recommendations.");
        const fallback = generateRuleBasedRecommendations(city, current, daily);
        return res.json({ recommendations: fallback, isFallback: true });
      }

      const ai = getGeminiClient();

      const weatherPrompt = `
You are a highly sophisticated Weather Intelligence Planner. Provide personalized, context-aware, and ultra-practical planning recommendations for the city of "${city}" based on the following meteorological data:

Current Conditions:
- Temperature: ${current.temp}°C (Apparent: ${current.apparent}°C)
- Humidity: ${current.humidity}%
- Wind Speed: ${current.windSpeed} km/h
- Rain/Precipitation: ${current.rain} mm
- Weather Code: ${current.weatherCode}

Daily 7-Day Context Summary:
- Temp Range: Max ${daily.tempMax[0]}°C / Min ${daily.tempMin[0]}°C
- Max UV Index: ${daily.uvIndex[0]}
- Precipitation Chance: ${daily.precipProb[0]}%
- Overall Week Temp Range: ${Math.min(...daily.tempMin)}°C to ${Math.max(...daily.tempMax)}°C

Please generate recommendations for the following fields:
1. clothing: What specifically to wear today (footwear, layers, accessories).
2. activities: Highly contextual indoor/outdoor activities suitable for this weather (e.g. running, museums, garden care).
3. precautions: Core safety or health precautions (sun protection, hydration, wind shields, umbrella, driving risks, temperature thresholds).
4. hourly_best: Advice on the best time windows of the day to go outside.
5. summary: A warm, concise conversational overview of the weather's vibe.

Please respond in JSON with the exact structure required. Make the recommendations tailored, interesting, and highly practical.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: weatherPrompt,
        config: {
          systemInstruction: "You are an expert Weather Intelligence Assistant that outputs advice strictly in JSON format. Avoid generic statements; specify practical items like fabrics, wind protection, or time blocks.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "Conversational overview sentence of the weather vibe."
              },
              clothing: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Specific clothing recommendations (e.g. fabrics, layers, footwear)."
              },
              activities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Recommended context-appropriate activities."
              },
              precautions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Safety, health, skin, and travel alerts or precautions."
              },
              hourly_best: {
                type: Type.STRING,
                description: "Best hours or timeframes of the day to do outdoor work/exercise."
              }
            },
            required: ["summary", "clothing", "activities", "precautions", "hourly_best"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API.");
      }

      const parsedRecommendations = JSON.parse(responseText.trim());
      res.json({ recommendations: parsedRecommendations, isFallback: false });

    } catch (error: any) {
      console.error("Gemini recommendation error:", error);
      // Return high-quality fallback on error so the application never breaks
      const fallback = generateRuleBasedRecommendations(city, current, daily);
      res.json({
        recommendations: fallback,
        isFallback: true,
        errorMessage: error.message || "Failed to generate recommendations with AI"
      });
    }
  });

  // Rule-based Fallback Generator
  function generateRuleBasedRecommendations(city: string, current: any, daily: any) {
    const temp = current.temp;
    const isRaining = current.rain > 0 || current.weatherCode === 3 || current.weatherCode === 4 || (current.weatherCode >= 50 && current.weatherCode <= 67) || (current.weatherCode >= 80 && current.weatherCode <= 82);
    const uv = daily.uvIndex[0] || 0;
    const wind = current.windSpeed;

    const clothing: string[] = [];
    const activities: string[] = [];
    const precautions: string[] = [];
    let hourly_best = "Most daylight hours are reasonable.";
    let summary = `Enjoying a moderate day in ${city}.`;

    // Temperature tailoring
    if (temp < 5) {
      summary = `It's freezing cold in ${city}. Bundle up!`;
      clothing.push("Heavy winter coat or parka", "Thermal base layers", "Fleece or wool socks", "Insulated gloves, beanie, and scarf");
      activities.push("Indoor reading or movies", "Winter hot drinks trail", "Visiting museums or galleries");
      precautions.push("Watch out for slippery roads or black ice", "Limit prolonged outdoor exposure to prevent frostbite", "Ensure heating systems are functioning");
      hourly_best = "Between 12:00 PM and 3:00 PM when temperatures peak slightly.";
    } else if (temp < 15) {
      summary = `A brisk, cool day in ${city}. Perfect for a light jacket.`;
      clothing.push("Light jacket, trench coat, or heavy sweater", "Jeans or long trousers", "Closed-toe shoes or boots");
      activities.push("Brisk park walks", "Visiting local cafes", "Outdoor photography with crisp skies");
      precautions.push("Keep a windbreaker handy", "Stay hydrated even if you don't feel warm");
      hourly_best = "Late morning through early afternoon (10:00 AM - 3:00 PM).";
    } else if (temp < 25) {
      summary = `Delightful, mild weather in ${city}. Absolutely lovely!`;
      clothing.push("T-shirt with a light cardigan or flannel layer", "Comfortable sneakers", "Casual pants or shorts");
      activities.push("Outdoor running or jogging", "Picnic in the park", "Cycling on city paths", "Al-fresco dining");
      precautions.push("UV levels can still cause sunburn; apply SPF", "Perfect outdoor weather - enjoy but carry water!");
      hourly_best = "Almost anytime during daylight, especially pleasant in the afternoon.";
    } else {
      summary = `It's hot in ${city}. Stay cool and stay hydrated!`;
      clothing.push("Breathable, loose cotton or linen fabrics", "Sunglasses and a wide-brimmed sun hat", "Open sandals or light trainers");
      activities.push("Poolside lounging or swimming", "Indoor air-conditioned visits", "Early morning running");
      precautions.push("Apply broad-spectrum sunscreen (SPF 30+)", "Drink plenty of electrolytes and water", "Avoid strenuous physical tasks in direct peak sun");
      hourly_best = "Early morning (6:00 AM - 9:00 AM) or after sunset (7:00 PM onwards) to avoid intense heat.";
    }

    // Weather code / Rain modifications
    if (isRaining) {
      summary = `It's wet and rainy in ${city} today.`;
      clothing.push("Waterproof jacket or raincoat", "Water-resistant boots or footwear", "Compact sturdy umbrella");
      activities.push("Explore a covered market", "Cozy up at a local coffee shop", "Visit an indoor museum, cinema, or library");
      precautions.push("Wet pavement is slick; drive and walk carefully", "Keep electronics fully sealed in waterproof bags", "Keep towels ready in your entryway");
      hourly_best = "Look for brief gaps in the cloud radar, or plan entirely indoor schedules.";
    }

    // UV additions
    if (uv > 6) {
      precautions.push(`Very High UV Index (${uv}). Avoid sun exposure between 10:00 AM and 4:00 PM. Wear sunglasses and SPF 50.`);
    }

    // Wind additions
    if (wind > 30) {
      summary += " It is also quite windy!";
      precautions.push("Secure loose outdoor objects and be cautious of falling branches or dust debris.");
    }

    return {
      summary,
      clothing,
      activities,
      precautions,
      hourly_best
    };
  }

  // Vite Integration: Serve React App
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite loading in Development Mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Weather Intelligence server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
