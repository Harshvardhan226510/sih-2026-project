import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) throw new Error("No text provided");

    const apiKey = Deno.env.get('MURF_API_KEY');
    if (!apiKey) throw new Error("MURF_API_KEY not set in Edge Function secrets");

    console.log("Starting Murf TTS Generation...");

    // 1. Get Token
    const tokenRes = await fetch('https://api.murf.ai/v1/auth/token', {
      method: 'GET',
      headers: { 'api-key': apiKey }
    });
    
    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Murf Auth failed: ${errText}`);
    }
    
    const { token } = await tokenRes.json();

    // 2. Generate Speech
    const generateRes = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify({
        voiceId: "en-IN-aarav",
        style: "Conversational",
        text: text,
        rate: 0,
        pitch: 0,
        sampleRate: 48000,
        format: "MP3",
        channelType: "MONO"
      })
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      throw new Error(`Murf Generate failed: ${errText}`);
    }

    const data = await generateRes.json();
    
    // Return the audio URL back to the frontend
    return new Response(JSON.stringify({ audioFile: data.audioFile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
