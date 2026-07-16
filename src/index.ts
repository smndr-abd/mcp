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

server.registerTool(
  "get_weather_forecast",
  {
    title: "Get Weather Forecast",
    description:
      "Returns a mock weather forecast for a given city. Replace with a real API call in production.",
    inputSchema: {
      city: z.string().describe("The name of the city to get the forecast for, e.g. 'Seoul'"),
    },
  },
  async ({ city }) => {
    const conditions = ["Sunny", "Cloudy", "Rainy", "Windy", "Snowy"];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 25) + 5;

    const mockForecast = {
      city,
      temperature_celsius: randomTemp,
      condition: randomCondition,
      humidity_percent: Math.floor(Math.random() * 60) + 30,
      note: "This is mock data for demonstration purposes.",
    };

    const emojiMap: Record<string, string> = {
      Sunny: "☀️",
      Cloudy: "☁️",
      Rainy: "🌧️",
      Windy: "💨",
      Snowy: "❄️",
    };
    const emoji = emojiMap[randomCondition] ?? "🌍";

    return {
      content: [
        {
          type: "text",
          text: `${emoji} **Weather in ${city}**\n🌡️ Temperature: ${randomTemp}°C\n${emoji} Condition: ${randomCondition}\n💧 Humidity: ${mockForecast.humidity_percent}%\n\n_${mockForecast.note}_`,
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.green("✔ Weather and Time MCP Server running on stdio"));
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});