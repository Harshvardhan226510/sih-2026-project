import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import AudioInput from './components/AudioInput';
import SuggestedQueries from './components/SuggestedQueries';
import { useChat } from './hooks/useChat';
import { useSpeech } from './hooks/useSpeech';

import './Module1View.css'; // Let's add some styles later

const Module1View = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const [inputText, setInputText] = useState('');
  
  // Use a ref to hold the speak function so the callback can access it
  const speakRef = useRef(null);

  const handleSpeechResult = async (transcript) => {
    setInputText('');
    const reply = await sendMessage(transcript);
    if (reply && speakRef.current) {
      speakRef.current(reply);
    }
  };

  const { isRecording, startRecording, stopRecording, speak } = useSpeech(handleSpeechResult);
  
  // Update the ref whenever speak changes (though it shouldn't change)
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);



  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleSuggestedQuery = (query) => {
    sendMessage(query);
  };

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <h1>Weather & Agriculture Assistant</h1>
        <p>Ask anything about weather alerts, crop advisories, or live data.</p>
      </div>

      <div className="chatbot-main">
        <ChatWindow messages={messages} isLoading={isLoading} />
        
        <div className="chatbot-input-area">
          <SuggestedQueries onSelect={handleSuggestedQuery} />
          
          <div className="input-group">
            <AudioInput 
              isRecording={isRecording} 
              onStart={startRecording} 
              onStop={stopRecording} 
            />
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="chat-text-input"
            />
            <button onClick={handleSend} disabled={isLoading || !inputText.trim()} className="send-btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Module1View;
