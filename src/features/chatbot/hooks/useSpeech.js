import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';

export const useSpeech = (onResult, currentLangHint = 'en-IN') => {
  const [isRecording, setIsRecording] = useState(false);
  const [activeAudio, setActiveAudio] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const browserRecRef = useRef(null);
  const browserTranscriptRef = useRef('');
  const isSpeakingRef = useRef(false);

  // Keep a ref of isSpeaking to prevent STT from listening to TTS
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event) => {
        if (isSpeakingRef.current) return; // Prevent infinite TTS-to-STT feedback loop!
        
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          browserTranscriptRef.current += finalTranscript + ' ';
        }
      };

      browserRecRef.current = rec;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      browserTranscriptRef.current = ''; // Reset browser transcript
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          try {
             // Pass the language hint derived from conversation context!
             const hint = currentLangHint.split('-')[0]; // e.g., mr-IN -> mr
             const { data, error } = await supabase.functions.invoke('stt-handler', {
                body: { audioData: base64Audio, langHint: hint }
             });
             if (error) throw error;
             if (data && data.text) {
                if (onResult) onResult(data.text);
             } else if (data && data.error) {
                throw new Error(data.error);
             }
          } catch(e) { 
             console.error("Groq STT failed. Using local Browser STT fallback.", e);
             // Fallback to what the browser heard while they were speaking!
             const fallbackText = browserTranscriptRef.current.trim();
             if (fallbackText && onResult) {
               onResult(fallbackText);
             } else {
               alert("Speech recognition failed. Please try again.");
             }
          } finally {
             mediaRecorderRef.current = null;
          }
        };
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      
      // Start browser STT simultaneously as a silent fallback
      if (browserRecRef.current) {
        browserRecRef.current.lang = currentLangHint;
        try { browserRecRef.current.start(); } catch(e){}
      }
      
    } catch (err) {
      console.error("Mic access denied or MediaRecorder failed.", err);
      alert("Microphone access is required.");
      setIsRecording(false);
    }
  }, [onResult, currentLangHint]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    } 
    
    if (browserRecRef.current) {
      try { browserRecRef.current.stop(); } catch(e) {}
    }
    
    setIsRecording(false);
  }, []);

  const stopAudio = useCallback(() => {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      setActiveAudio(null);
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [activeAudio]);

  const speak = useCallback(async (text, langCode = 'en-IN') => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // Use Murf API for Hindi/Marathi/Devanagari for high-quality regional voices, but use Native TTS for English/Hinglish to avoid latency
    const hasDevanagari = /[\u0900-\u097F]/.test(text);
    if (langCode === 'hi-IN' || langCode === 'mr-IN' || hasDevanagari) {
      try {
        const { data, error } = await supabase.functions.invoke('tts-handler', {
          body: { text: text, language: langCode }
        });

        if (!error && data && data.audioFile) {
          const audio = new Audio(data.audioFile);
          setActiveAudio(audio);
          
          audio.onplay = () => setIsSpeaking(true);
          audio.onended = () => {
            setActiveAudio(null);
            setIsSpeaking(false);
          };
          audio.onpause = () => setIsSpeaking(false);
          
          audio.play();
          return; // Exit early if Murf API succeeded
        }
      } catch (err) {
        console.error("Murf API failed, falling back to Browser TTS:", err);
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      console.log("Falling back to Browser Native TTS");
      const utterance = new SpeechSynthesisUtterance(text);
      
      let ttsLang = langCode;
      const hasHinglish = /baarish|mausam|tapman|nami|hawa|jankari|haan|nahi|kya|hai/i.test(text);

      if (hasDevanagari || hasHinglish) {
        ttsLang = (langCode === 'mr-IN') ? 'mr-IN' : 'hi-IN';
      }
      
      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        let preferredVoices = voices.filter(v => v.lang === ttsLang || v.lang.replace('_', '-') === ttsLang);
        
        if (preferredVoices.length === 0) {
          preferredVoices = voices.filter(v => v.lang.startsWith(ttsLang.split('-')[0]));
        }

        // Avoid male voices
        let femaleVoices = preferredVoices.filter(v => !/male|ravi|david|mark/i.test(v.name));
        
        // Prioritize known female names
        let bestVoice = femaleVoices.find(v => /female|heera|zira|aditi|swara|veena|google/i.test(v.name));
        
        let selectedVoice = bestVoice || femaleVoices[0] || preferredVoices[0];

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        window.speechSynthesis.speak(utterance);
        
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
      };

      // Handle async voice loading in some browsers
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      } else {
        setVoiceAndSpeak();
      }
    }
  }, [activeAudio]);

  return { isRecording, startRecording, stopRecording, speak, stopAudio, isSpeaking };
};
