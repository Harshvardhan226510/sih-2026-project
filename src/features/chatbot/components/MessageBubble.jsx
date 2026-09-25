import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { formatTime } from '../utils/formatters';

const MessageBubble = ({ message, speak, stopAudio, isSpeaking, language }) => {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  
  return (
    <div className={`message-bubble-container ${isUser ? 'user-container' : 'bot-container'}`}>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        {message.attachedFileData && message.attachedFileData.base64 && (
          <div className="mb-2 rounded-lg overflow-hidden border border-slate-200" style={{ maxWidth: '300px' }}>
            <img 
              src={`data:${message.attachedFileData.mimeType};base64,${message.attachedFileData.base64}`} 
              alt="Attached file" 
              className="w-full h-auto object-contain"
            />
          </div>
        )}
        <div className="message-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
        
        {message.citations && message.citations.length > 0 && (
          <div className="citations-container">
            <button 
              className="sources-toggle-btn" 
              onClick={() => setShowSources(!showSources)}
            >
              ℹ️ Sources
            </button>
            {showSources && (
              <div className="sources-popup">
                <h4>Data Providers:</h4>
                <ul>
                  {message.citations.map((c, i) => {
                    let link = "#";
                    if (c === "Open-Meteo API") link = "https://open-meteo.com/en/docs";
                    if (c === "IMD / Open-Meteo Alerts API") link = "https://mausam.imd.gov.in";
                    if (c === "Supabase crop_stage_rules DB") link = "https://supabase.com";
                    if (c === "Historical Weather API") link = "https://open-meteo.com/en/docs/historical-weather-api";
                    if (c === "Weather Forecast API") link = "https://open-meteo.com/en/docs";
                    return (
                      <li key={i}>
                        <a href={link} target="_blank" rel="noreferrer">{c}</a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
        
        <div className="message-footer">
          {message.modelUsed && <span className="model-badge">✨ {message.modelUsed}</span>}
          <span className="message-time">{formatTime(message.timestamp || new Date())}</span>
        </div>
      </div>
      {!isUser && (
        <div className="message-actions">
          {isSpeaking ? (
            <button className="tts-play-btn stop-btn" onClick={stopAudio} aria-label="Stop Audio">
              🔇
            </button>
          ) : (
            <button className="tts-play-btn" onClick={() => speak(message.content, message.languageCode)} aria-label="Read aloud">
              🔊
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
