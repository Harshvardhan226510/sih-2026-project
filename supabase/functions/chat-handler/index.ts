import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { handleChatRequestStream } from "./llm.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    }});
  }

  try {
    const { messages, fileData } = await req.json();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await handleChatRequestStream(messages, fileData, controller);
        } catch (err) {
          console.error(err);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'text', text: `\n\nError: ${err.message}` })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { 
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
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
