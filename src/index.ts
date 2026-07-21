#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import chalk from "chalk";

const server = new McpServer({
  name: "weather-time-server",
  version: "1.0.0",
});

server.registerTool(
  "get_current_time",
  {
    title: "Get Current Time",
    description: "Returns the current system date and time in ISO format.",
    inputSchema: {},
  },
  async () => {
    const now = new Date();
    const formatted = now.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    return {
      content: [{ type: "text", text: `🕒 **Current Time**\n${formatted}` }],
    };
  }
);

// Helper: map Open-Meteo's numeric weather codes to human-readable text + emoji
function describeWeatherCode(code: number): { label: string; emoji: string } {
  const map: Record<number, { label: string; emoji: string }> = {
    0: { label: "Clear sky", emoji: "☀️" },
    1: { label: "Mainly clear", emoji: "🌤️" },
    2: { label: "Partly cloudy", emoji: "⛅" },
    3: { label: "Overcast", emoji: "☁️" },
    45: { label: "Fog", emoji: "🌫️" },
    48: { label: "Depositing rime fog", emoji: "🌫️" },
    51: { label: "Light drizzle", emoji: "🌦️" },
    61: { label: "Slight rain", emoji: "🌧️" },
    63: { label: "Moderate rain", emoji: "🌧️" },
    65: { label: "Heavy rain", emoji: "🌧️" },
    71: { label: "Slight snow", emoji: "🌨️" },
    75: { label: "Heavy snow", emoji: "❄️" },
    80: { label: "Rain showers", emoji: "🌦️" },
    95: { label: "Thunderstorm", emoji: "⛈️" },
  };
  return map[code] ?? { label: "Unknown", emoji: "🌍" };
}

server.registerTool(
  "get_weather_forecast",
  {
    title: "Get Weather Forecast",
    description: "Returns the current real-world weather forecast for a given city, using live data from Open-Meteo.",
    inputSchema: {
      city: z.string().describe("The name of the city to get the forecast for, e.g. 'Seoul'"),
    },
  },
  async ({ city }) => {
    try {
      // 1. Convert city name -> latitude/longitude
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        return {
          content: [{ type: "text", text: `❌ Couldn't find a location named "${city}". Please check the spelling.` }],
          isError: true,
        };
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // 2. Fetch the actual forecast for those coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
      );
      const weatherData = await weatherRes.json();
      const current = weatherData.current;

      const { label, emoji } = describeWeatherCode(current.weather_code);

      return {
        content: [
          {
            type: "text",
            text: `${emoji} **Weather in ${name}, ${country}**\n🌡️ Temperature: ${current.temperature_2m}°C\n${emoji} Condition: ${label}\n💧 Humidity: ${current.relative_humidity_2m}%\n💨 Wind: ${current.wind_speed_10m} km/h`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `⚠️ Failed to fetch weather data: ${error instanceof Error ? error.message : "Unknown error"}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});