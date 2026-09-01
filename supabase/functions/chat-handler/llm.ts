// @ts-ignore: Deno module imports are not recognized by the default tsconfig
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';
import { getWeatherObservation, getActiveAlerts, getCropAdvisory, getHistoricalWeather, getWeatherForecast } from './db_queries.ts';

// @ts-ignore: Deno global is not recognized by the default tsconfig
const apiKey = Deno.env.get('GEMINI_API_KEY');
const genAI = new GoogleGenerativeAI(apiKey || '');

const tools = [{
  functionDeclarations: [
    {
      name: "getWeatherObservation",
      description: "Get the current live weather observation for a specific location/city in India.",
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
      name: "getHistoricalWeather",
      description: "Get historical weather data (past weather) for a specific location and date.",
      parameters: {
        type: "OBJECT",
        properties: {
          locationName: {
            type: "STRING",
            description: "The name of the city or location (e.g., Nagpur, Pune)",
          },
          date: {
            type: "STRING",
            description: "The date for which historical weather is requested in YYYY-MM-DD format (e.g. 2026-08-27)",
          },
        },
        required: ["locationName", "date"],
      },
    },
    {
      name: "getWeatherForecast",
      description: "Get the weather forecast (chance of rain, temperature) for the upcoming days for a specific location.",
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

export const handleChatRequestStream = async (messages: any[], fileData: any, controller: ReadableStreamDefaultController) => {
  const latestMessage = messages[messages.length - 1].content;
  const encoder = new TextEncoder();
  const sendChunk = (data: any) => {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch (e) {
      console.error("Stream closed", e);
    }
  };

  const executeChatStream = async (modelName: string) => {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      tools: tools,
      systemInstruction: `You are a specialized Agricultural and Weather AI Assistant for Indian farmers.
You have access to highly accurate weather and agricultural data through your function tools.

ZERO HALLUCINATION RULE:
1. If the user asks for specific weather, cyclone, or agricultural advisory data, you MUST use the appropriate function tool to fetch the data.
2. If the tool returns no data, or if you do not have a tool to answer a specific factual query about weather/agriculture, you MUST state that you do not have data available for this query through your connected APIs. However, you MUST output this statement in the SAME language as the user's query. Do NOT output a hardcoded English string.
3. EXCEPTION for Conversational Memory: You are ALLOWED to answer conversational queries (e.g., greetings, general chat) and questions about your own chat history.
4. DO NOT mention the data source in your text response. The user interface will automatically display the source as a button. Never write 'Source: ...' in your text.
5. LANGUAGE MIRRORING RULE (CRITICAL): You MUST automatically detect the language of the user's input (English, Hindi, or Marathi) and reply ENTIRELY in that exact same language. Do NOT get stuck in the previous conversation's language if the user switches languages!
   - If Hindi or Marathi: You MUST use proper Devanagari script. Do NOT use English alphabets or Hinglish. Use pure native rural terms (e.g., मौसम, बारिश, तापमान).
   - If English: Reply in English.
6. MANDATORY LANGUAGE TAG: You MUST begin your very first sentence with exactly one of these hidden tags: [LANG: hi-IN], [LANG: mr-IN], or [LANG: en-IN] to declare the language you have chosen to reply in. Example response: "[LANG: hi-IN] आज का मौसम..."
7. TTS WORKAROUND FOR MARATHI (CRITICAL): We are using a Hindi TTS engine for Marathi. If you are replying in Marathi, you MUST spell out ALL numbers using Marathi words (e.g. write "पंचवीस" instead of 25, "शून्य" instead of 0). Never use digits in Marathi.
8. FORMATTING: Keep your answers concise. ALWAYS use markdown formatting (like bullet points) when listing weather observations, forecasts, or multiple pieces of data to make it easily readable.
9. If an image or document is provided, analyze it accurately in the context of agriculture.
10. CONVERSATIONAL CONTEXT: Always remember and use the data from previous interactions in the chat history. For example, if you just checked the forecast and found a 100% chance of rain, and the user subsequently asks if they should spray pesticide, you MUST connect the dots and advise them NOT to spray due to the upcoming rain.`
    });

    const history = messages.slice(0, -1).map(m => {
      const parts: any[] = [{ text: m.content }];
      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const languageDirective = `\n\n[SYSTEM DIRECTIVE: You MUST respond in the EXACT language of the user's text above (English, Hindi, or Marathi). Do NOT use the language of the previous conversation history if the user just switched languages.]`;
    const latestParts: any[] = [{ text: latestMessage + languageDirective }];

    let citations: string[] = [];
    if (fileData && fileData.base64 && fileData.mimeType) {
      latestParts.push({
        inlineData: {
          data: fileData.base64,
          mimeType: fileData.mimeType
        }
      });
      citations.push("Image Analysis");
    }

    const chat = model.startChat({ history });

    let metaSent = false;
    const ensureMetaSent = () => {
      if (!metaSent) {
        const apiProviders = citations.map(c => {
          if (c === "Live Weather API") return "Open-Meteo API";
          if (c === "Live Alerts API") return "IMD / Open-Meteo Alerts API";
          if (c === "Agricultural Database") return "Supabase crop_stage_rules DB";
          return c;
        });
        sendChunk({ type: 'meta', citations: [...new Set(apiProviders)], modelUsed: modelName });
        metaSent = true;
      }
    };

    let resultStream = await chat.sendMessageStream(latestParts);
    let functionCalls: any[] = [];

    let textBuffer = "";
    let languageDetected = false;

    const processTextChunk = (chunkText: string) => {
      if (!languageDetected) {
        textBuffer += chunkText;
        if (textBuffer.includes(']')) {
          const match = textBuffer.match(/\[LANG:\s*([a-zA-Z-]+)\]/i);
          if (match) {
            sendChunk({ type: 'language', code: match[1].trim() });
            textBuffer = textBuffer.replace(match[0], '').trimStart();
          } else {
            sendChunk({ type: 'language', code: 'en-IN' }); // Fallback
          }
          languageDetected = true;
          if (textBuffer) {
            sendChunk({ type: 'text', text: textBuffer });
            textBuffer = "";
          }
        } else if (textBuffer.length > 30) {
          languageDetected = true;
          sendChunk({ type: 'language', code: 'en-IN' }); // Fallback
          sendChunk({ type: 'text', text: textBuffer });
          textBuffer = "";
        }
      } else {
        sendChunk({ type: 'text', text: chunkText });
      }
    };

    // Pass 1: Stream or catch function call
    for await (const chunk of resultStream.stream) {
      const calls = typeof chunk.functionCalls === 'function' ? chunk.functionCalls() : chunk.functionCalls;
      if (calls && calls.length > 0) {
        functionCalls = calls;
        break; // Stop streaming text, we have a tool to call
      }
      try {
        const chunkText = chunk.text();
        if (chunkText) {
          ensureMetaSent();
          processTextChunk(chunkText);
        }
      } catch (e: any) {
        ensureMetaSent();
        sendChunk({ type: 'text', text: `\n[Model Blocked/Error: ${e.message}]` });
      }
    }

    if (functionCalls.length === 0 && textBuffer.length > 0) {
      if (!languageDetected) sendChunk({ type: 'language', code: 'en-IN' });
      sendChunk({ type: 'text', text: textBuffer });
      textBuffer = "";
    }

    let callCount = 0;
    while (functionCalls && functionCalls.length > 0 && callCount < 3) {
      const call = functionCalls[0];
      let apiResponse = {};

      console.log("LLM called function:", call.name, call.args);

      if (call.name === "getWeatherObservation") {
        apiResponse = await getWeatherObservation(call.args.locationName as string);
        citations.push("Live Weather API");
      } else if (call.name === "getHistoricalWeather") {
        apiResponse = await getHistoricalWeather(call.args.locationName as string, call.args.date as string);
        citations.push("Historical Weather API");
      } else if (call.name === "getWeatherForecast") {
        apiResponse = await getWeatherForecast(call.args.locationName as string);
        citations.push("Weather Forecast API");
      } else if (call.name === "getActiveAlerts") {
        apiResponse = await getActiveAlerts();
        citations.push("Live Alerts API");
      } else if (call.name === "getCropAdvisory") {
        apiResponse = await getCropAdvisory(call.args.cropName as string, call.args.stage as string || "");
        citations.push("Agricultural Database");
      } else {
        apiResponse = { error: "Unknown function" };
      }

      const toolStream = await chat.sendMessageStream([{
        text: `[System Info]: The tool '${call.name}' was executed successfully. Here is the JSON result:\n${JSON.stringify(apiResponse)}\n\nIMPORTANT: Use this data to answer the user's specific question. \n\nCRITICAL LANGUAGE DIRECTIVE: You MUST reply in the EXACT SAME LANGUAGE and script (Devanagari for Hindi/Marathi) as the user's original question below:\nUser's Question: "${latestMessage}"\n\nDo NOT reply in English if the user asked in Hindi/Marathi! Do NOT forget the [LANG: xx-IN] tag.`
      }]);

      functionCalls = [];
      for await (const chunk of toolStream.stream) {
        const calls = typeof chunk.functionCalls === 'function' ? chunk.functionCalls() : chunk.functionCalls;
        if (calls && calls.length > 0) {
          functionCalls = calls;
          break; 
        }
        try {
          const chunkText = chunk.text();
          if (chunkText) {
            ensureMetaSent();
            processTextChunk(chunkText);
          }
        } catch (e: any) {
          ensureMetaSent();
          sendChunk({ type: 'text', text: `\n[Model Blocked/Error: ${e.message}]` });
        }
      }

      if (textBuffer.length > 0) {
        if (!languageDetected) sendChunk({ type: 'language', code: 'en-IN' });
        sendChunk({ type: 'text', text: textBuffer });
        textBuffer = "";
      }

      callCount++;
    }
  };

  try {
    // Primary Model
    await executeChatStream("gemini-flash-lite-latest");
  } catch (error: any) {
    console.error("Gemini Lite Flash Error:", error);
    
    // Fallback 1: Same provider, larger model
    console.log("Falling back to gemini-3.5-flash...");
    try {
      await executeChatStream("gemini-3.5-flash");
    } catch (fallbackErr1: any) {
      console.error("Gemini 3.5 Flash Error:", fallbackErr1);
      
      // Fallback 2: Same provider, legacy stable model
      console.log("Falling back to gemini-3.6-flash...");
      try {
        await executeChatStream("gemini-3.6-flash");
      } catch (fallbackErr2: any) {
        console.error("Gemini 3.6 Flash Error:", fallbackErr2);
        
        // Fallback 3: Other Provider (Groq)
        // @ts-ignore: Deno global is not recognized by the default tsconfig
        const groqKey = Deno.env.get('GROQ_API_KEY');
        if (!groqKey) {
          sendChunk({ type: 'text', text: `Sorry, all Google Gemini models are currently unavailable, and no GROQ_API_KEY was found to trigger the secondary provider fallback. Error: ${fallbackErr2.message}` });
        } else {
          sendChunk({ type: 'text', text: `\n[System: Switching to Groq fallback due to Google API failure...]\n` });
          try {
            const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "qwen/qwen3.8-27b",
                messages: [{ role: "system", content: "You are an AI assistant." }, { role: "user", content: latestMessage }]
              })
            });
            const groqData = await groqRes.json();
            if (groqData.choices && groqData.choices[0]) {
               sendChunk({ type: 'text', text: groqData.choices[0].message.content });
            } else {
               sendChunk({ type: 'text', text: `Groq Fallback failed: ${JSON.stringify(groqData)}` });
            }
          } catch (groqErr: any) {
            sendChunk({ type: 'text', text: `Sorry, all API providers failed. Groq Error: ${groqErr.message}` });
          }
        }
      }
    }
  }
};
