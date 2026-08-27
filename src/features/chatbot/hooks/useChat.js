import { useState } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (text) => {
    // Add user message immediately
    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Invoke the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chat-handler', {
        body: { messages: updatedMessages.map(m => ({ role: m.role, content: m.content })) }
      });

      if (error) throw error;

      const botMsg = { 
        role: 'bot', 
        content: data.reply || "I didn't receive a response.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
      return botMsg.content;
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = { role: 'bot', content: `Sorry, I encountered an error: ${error.message}`, timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
      return errorMsg.content;
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, sendMessage, isLoading };
};
