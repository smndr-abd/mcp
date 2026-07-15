#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({
    name: "weather-time-server",
    version: "1.0.0",
});
server.registerTool("get_current_time", {
    title: "Get Current Time",
    description: "Returns the current system date and time in ISO format.",
    inputSchema: {},
}, async () => {
    const now = new Date().toISOString();
    return {
        content: [{ type: "text", text: `The current system time is: ${now}` }],
    };
});
server.registerTool("get_weather_forecast", {
    title: "Get Weather Forecast",
    description: "Returns a mock weather forecast for a given city. Replace with a real API call in production.",
    inputSchema: {
        city: z.string().describe("The name of the city to get the forecast for, e.g. 'Seoul'"),
    },
}, async ({ city }) => {
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
    return {
        content: [
            { type: "text", text: `Weather forecast for ${city}: ${JSON.stringify(mockForecast, null, 2)}` },
        ],
    };
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Weather and Time MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map