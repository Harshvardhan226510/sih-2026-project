import "jsr:@supabase/functions-js/edge-runtime.d.ts";
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
    const { text, language = 'en-IN' } = await req.json();
    if (!text) throw new Error("No text provided");

    console.log("Starting Sarvam TTS Generation for language:", language);

    const LOCALE_MAP: Record<string, string> = {
      'mr': 'mr-IN', 'marathi': 'mr-IN', 'mr-in': 'mr-IN',
      'hi': 'hi-IN', 'hindi': 'hi-IN', 'hi-in': 'hi-IN',
      'en': 'en-IN', 'english': 'en-IN', 'en-in': 'en-IN'
    };

    const normalizedLang = LOCALE_MAP[language.toLowerCase()] || language;

    // Map language to Sarvam format
    let targetLanguage = "en-IN";
    let selectedSpeaker = "arav"; // Default male voice for English (let's use anushka for all)
    
    if (normalizedLang === 'hi-IN' || normalizedLang === 'mr-IN') {
      targetLanguage = normalizedLang;
    }
    
    // "priya" works for bulbul:v3
    selectedSpeaker = "priya";

    const sarvamApiKey = Deno.env.get('SARVAM_API_KEY');
    if (!sarvamApiKey) throw new Error("SARVAM_API_KEY not set in Edge Function secrets");

    const payload = {
      inputs: [text],
      target_language_code: targetLanguage,
      speaker: selectedSpeaker,
      speech_sample_rate: 8000,
      enable_preprocessing: true,
      model: "bulbul:v3"
    };

    const generateRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': sarvamApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      throw new Error(`Sarvam TTS failed: ${errText}`);
    }

    const data = await generateRes.json();
    
    if (!data.audios || data.audios.length === 0) {
       throw new Error("No audio returned from Sarvam");
    }

    // Convert base64 string to a data URL that can be played by new Audio()
    const audioDataUrl = `data:audio/wav;base64,${data.audios[0]}`;
    
    // Return the audio URL back to the frontend
    return new Response(JSON.stringify({ audioFile: audioDataUrl }), {
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
