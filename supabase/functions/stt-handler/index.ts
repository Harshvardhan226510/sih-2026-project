import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioData, langHint } = await req.json();

    if (!audioData) {
      return new Response(JSON.stringify({ error: "No audio data provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Convert base64 data URL to Blob
    const base64Parts = audioData.split(',');
    const mimeString = base64Parts[0].split(':')[1].split(';')[0];
    const byteCharacters = atob(base64Parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const audioBlob = new Blob([byteArray], { type: mimeString });

    const apiKey = Deno.env.get('SARVAM_API_KEY');
    if (!apiKey) throw new Error("SARVAM_API_KEY not set in Edge Function secrets");
    const apiEndpoint = "https://api.sarvam.ai/speech-to-text";
    
    const sarvamFormData = new FormData();
    sarvamFormData.append('file', audioBlob, 'audio.webm');
    
    // Let Sarvam AI auto-detect the language so the user can switch languages freely mid-conversation!
    // Do NOT pass language_code, otherwise it forces transliteration of English into Hindi.
    
    const apiRes = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey
      },
      body: sarvamFormData
    });

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      throw new Error(`STT API Error: ${errorText}`);
    }

    const resData = await apiRes.json();
    const transcribedText = resData.transcript || resData.text;

    return new Response(JSON.stringify({ text: transcribedText, language: langHint || 'auto' }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("STT Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
