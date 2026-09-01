import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import AudioInput from './components/AudioInput';
import SuggestedQueries from './components/SuggestedQueries';
import { useChat } from './hooks/useChat';
import { useSpeech } from './hooks/useSpeech';
import { useWeather } from '../../context/WeatherContext';

import './Module1View.css';

const Module1View = () => {
  const { messages, sendMessage, isLoading } = useChat();
  const [inputText, setInputText] = useState('');
  const { croppedSpatialContext } = useWeather();
  const processedContextRef = useRef(null);
  
  const speakRef = useRef(null);

  const handleSpeechResult = async (transcript) => {
    setInputText('');
    const reply = await sendMessage(transcript);
    if (reply && speakRef.current) {
      speakRef.current(reply);
    }
  };

  const { isRecording, startRecording, stopRecording, speak } = useSpeech(handleSpeechResult);
  
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    if (croppedSpatialContext && processedContextRef.current !== croppedSpatialContext) {
      processedContextRef.current = croppedSpatialContext;

      const spatialPrompt =
        `📍 SPATIAL MAP REGION ANALYSIS REQUEST\n` +
        `Region Center: ${croppedSpatialContext.center.lat}°N, ${croppedSpatialContext.center.lon}°E\n` +
        `Geographic Extent: ${croppedSpatialContext.bounds.southWest} to ${croppedSpatialContext.bounds.northEast}\n` +
        `Active GIS Map Layers: ${croppedSpatialContext.activeLayers.join(', ')}\n` +
        (croppedSpatialContext.alertsCount > 0
          ? `Active SACHET Warnings in Region: ${croppedSpatialContext.alertsCount} Alert(s) (${croppedSpatialContext.alertsSummary})\n`
          : `Active SACHET Warnings in Region: None\n`) +
        `Please provide a detailed meteorological analysis of this selected geographic area, including weather risks, temperature trends, wind patterns, and agricultural advisories.`;

      sendMessage(spatialPrompt);
    }
  }, [croppedSpatialContext]);

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
