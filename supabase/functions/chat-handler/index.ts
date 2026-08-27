import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleChatRequest } from "./llm.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }});
  }

  try {
    const { messages } = await req.json();
    
    // Will hook up RAG and LLM here
    const reply = await handleChatRequest(messages);
    
    return new Response(JSON.stringify({ reply }), { 
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
    });
  }
})
