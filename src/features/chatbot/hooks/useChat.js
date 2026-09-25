import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/lib/supabaseClient';

export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Initialize Sessions from localStorage
  useEffect(() => {
    const storedSessions = JSON.parse(localStorage.getItem('chatbot_sessions') || '[]');
    setSessions(storedSessions);
    
    if (storedSessions.length > 0) {
      setCurrentSessionId(storedSessions[0].id);
    } else {
      createNewSession();
    }
  }, []);

  const createNewSession = () => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : 'session-' + Date.now();
    const newSession = { id: newId, title: 'New Chat', created_at: new Date().toISOString() };
    
    setSessions(prev => {
      const updated = [newSession, ...prev];
      localStorage.setItem('chatbot_sessions', JSON.stringify(updated));
      return updated;
    });
    setCurrentSessionId(newId);
    setMessages([]);
  };

  const switchSession = (id) => {
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
  };

  const deleteSession = async (id) => {
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    localStorage.setItem('chatbot_sessions', JSON.stringify(updatedSessions));
    
    if (currentSessionId === id) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }

    try {
      await supabase.from('chat_logs').delete().eq('user_id', id); // using user_id col as session_id
    } catch (err) {
      console.error("Failed to delete session memory:", err);
    }
  };

  // Load messages when current session changes
  useEffect(() => {
    const fetchMemory = async () => {
      if (!currentSessionId) return;
      setIsLoading(true);
      try {
        // Load from local storage to bypass DB security blocks for the demo
        const savedMessages = localStorage.getItem(`chat_messages_${currentSessionId}`);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages).map(m => ({ ...m, isHistory: true }));
          setMessages(parsed);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load memory:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemory();
  }, [currentSessionId]);

  const sendMessage = async (text, fileData = null) => {
    if (!text.trim() && !fileData) return;
    setIsLoading(true);

    const userMsg = { role: 'user', content: text, timestamp: new Date(), attachedFileData: fileData };
    const updatedMessages = [...messages, userMsg];
    
    if (currentSessionId) {
      localStorage.setItem(`chat_messages_${currentSessionId}`, JSON.stringify(updatedMessages));
    }
    
    setMessages(updatedMessages);

    if (messages.length === 0) {
      const shortTitle = text.length > 25 ? text.substring(0, 25) + '...' : text;
      setSessions(prev => {
        const updated = prev.map(s => s.id === currentSessionId ? { ...s, title: shortTitle } : s);
        localStorage.setItem('chatbot_sessions', JSON.stringify(updated));
        return updated;
      });
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-handler`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          fileData: fileData
        })
      });

      if (!response.ok) throw new Error("Failed to connect to AI");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      
      let botContent = "";
      let botCitations = [];
      let botModelUsed = "";
      let botLanguageCode = "en-IN"; // Default
      let buffer = "";

      setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: new Date() }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'meta') {
                  botCitations = data.citations;
                  botModelUsed = data.modelUsed;
                } else if (data.type === 'language') {
                  botLanguageCode = data.code;
                } else if (data.type === 'text') {
                  botContent += data.text;
                }
                
                setMessages(prev => {
                  const updated = [...prev];
                  const lastIndex = updated.length - 1;
                  updated[lastIndex] = {
                    ...updated[lastIndex],
                    content: botContent,
                    citations: botCitations,
                    modelUsed: botModelUsed,
                    languageCode: botLanguageCode
                  };
                  return updated;
                });
              } catch (e) {
                // Ignore incomplete JSON chunks
              }
            }
          }
        }
      }

      setMessages(prev => {
        if (currentSessionId) {
          localStorage.setItem(`chat_messages_${currentSessionId}`, JSON.stringify(prev));
        }
        return prev;
      });

      if (currentSessionId) {
        supabase.from('chat_logs').insert([{
          user_id: currentSessionId,
          query: text,
          response: botContent,
          sources: botCitations,
          language: botLanguageCode
        }]).then(({ error }) => {
          if (error) console.error("Failed to save memory:", error);
        });
      }

      return { text: botContent, langCode: botLanguageCode };
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg = { role: 'bot', content: `Sorry, I encountered an error: ${error.message}`, timestamp: new Date() };
      
      const finalMessages = [...updatedMessages, errorMsg];
      if (currentSessionId) {
        localStorage.setItem(`chat_messages_${currentSessionId}`, JSON.stringify(finalMessages));
      }
      setMessages(finalMessages);
      
      return { text: errorMsg.content, langCode: 'en-IN' };
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    messages, 
    sendMessage, 
    isLoading, 
    sessions, 
    currentSessionId, 
    createNewSession, 
    switchSession, 
    deleteSession 
  };
};
