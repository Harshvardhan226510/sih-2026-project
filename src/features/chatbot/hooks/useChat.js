import { useState } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDirectGemini = async (conversation) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: conversation.map((m) => ({
              role: m.role === 'bot' ? 'model' : 'user',
              parts: [{ text: m.content }]
            }))
          })
        }
      );
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  };

  const sendMessage = async (text) => {
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      let botReply = null;

      try {
        const { data, error } = await supabase.functions.invoke('chat-handler', {
          body: { messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })) }
        });

        if (
          !error &&
          data?.reply &&
          !data.reply.includes('GoogleGenerativeAI Error') &&
          !data.reply.includes('404 Not Found') &&
          !data.reply.includes('429 Too Many Requests') &&
          !data.reply.includes('Quota exceeded') &&
          !data.reply.startsWith('Sorry, I encountered an error')
        ) {
          botReply = data.reply;
        }
      } catch {}

      if (!botReply) {
        botReply = await fetchDirectGemini(updatedMessages);
      }

      const finalReply = botReply || "I'm having trouble processing that right now. Please try again.";

      const botMsg = {
        role: 'bot',
        content: finalReply,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
      return botMsg.content;
    } catch (error) {
      const errorMsg = {
        role: 'bot',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
      return errorMsg.content;
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};
