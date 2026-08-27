import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';

export const useSpeech = (onResult) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Default to Indian English

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
        setIsRecording(false);
      };

      rec.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }
  }, [onResult]);

  const startRecording = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Could not start recognition:", err);
      }
    }
  }, [recognition]);

  const stopRecording = useCallback(() => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  }, [recognition, isRecording]);

  const speak = useCallback(async (text) => {
    try {
      // 1. Try to use the secure TTS Edge Function (Murf AI)
      const { data, error } = await supabase.functions.invoke('tts-handler', {
        body: { text: text }
      });

      if (error) {
        console.error("Supabase TTS Edge Function Error:", error);
      } else if (data && data.audioFile) {
        const audio = new Audio(data.audioFile);
        audio.play();
        return; // Successfully played Murf audio!
      }
    } catch (err) {
      console.error("Error calling TTS Edge Function:", err);
    }

    // 2. Fallback: Browser Native TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log("Falling back to Browser Native TTS");
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('IN')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return { isRecording, startRecording, stopRecording, speak };
};
