import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { getWeatherObservation, getActiveAlerts, getCropAdvisory } from './db_queries.ts';

const apiKey = Deno.env.get('GEMINI_API_KEY');
const genAI = new GoogleGenerativeAI(apiKey || '');

const tools = [{
  functionDeclarations: [
    {
      name: "getWeatherObservation",
      description: "Get the current weather observation for a specific location/city in India.",
      parameters: {
        type: "OBJECT",
        properties: {
          locationName: {
            type: "STRING",
            description: "The name of the city or location (e.g., Nagpur, Pune)",
          },
        },
        required: ["locationName"],
      },
    },
    {
      name: "getActiveAlerts",
      description: "Get any active weather or agricultural alerts and warnings.",
      parameters: {
        type: "OBJECT",
        properties: {},
      },
    },
    {
      name: "getCropAdvisory",
      description: "Get agricultural advisory for a specific crop, optionally at a specific growth stage.",
      parameters: {
        type: "OBJECT",
        properties: {
          cropName: {
            type: "STRING",
            description: "The name of the crop (e.g., Wheat, Cotton, Rice)",
          },
          stage: {
            type: "STRING",
            description: "The growth stage of the crop (e.g., Sowing, Harvesting). Leave empty if unknown.",
          },
        },
        required: ["cropName"],
      },
    },
  ]
}];

export const handleChatRequest = async (messages: any[]) => {
  if (!apiKey) {
    return "Error: GEMINI_API_KEY is not set in Edge Function secrets.";
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: tools
    });

    // Convert standard {role, content} to Gemini's format {role: 'user'|'model', parts: [{text}]}
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const latestMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });

    let result = await chat.sendMessage([{ text: latestMessage }]);
    let response = result.response;
    
    // Robustly extract function calls
    const extractFunctionCalls = (resp: any) => {
      if (typeof resp.functionCalls === 'function') {
        return resp.functionCalls() || [];
      }
      const parts = resp.candidates?.[0]?.content?.parts || [];
      return parts.map((p: any) => p.functionCall).filter(Boolean);
    };

    let functionCalls = extractFunctionCalls(response);

    // Handle tool calls recursively (up to 3 times to prevent infinite loops)
    let callCount = 0;
    while (functionCalls && functionCalls.length > 0 && callCount < 3) {
      const call = functionCalls[0];
      let apiResponse = {};

      console.log("LLM called function:", call.name, call.args);

      if (call.name === "getWeatherObservation") {
        apiResponse = await getWeatherObservation(call.args.locationName as string);
      } else if (call.name === "getActiveAlerts") {
        apiResponse = await getActiveAlerts();
      } else if (call.name === "getCropAdvisory") {
        apiResponse = await getCropAdvisory(call.args.cropName as string, call.args.stage as string || "");
      } else {
        apiResponse = { error: "Unknown function" };
      }

      result = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: apiResponse
        }
      }]);

      response = result.response;
      functionCalls = extractFunctionCalls(response);
      callCount++;
    }

    return response.text();
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Sorry, I encountered an error while processing your request: ${error.message}`;
  }
};
