import React from 'react';
import { formatTime } from '../utils/formatters';
import { useSpeech } from '../hooks/useSpeech';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const { speak } = useSpeech();
  
  return (
    <div className={`message-bubble-container ${isUser ? 'user-container' : 'bot-container'}`}>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        <div className="message-content">
          <p>{message.content}</p>
        </div>
        <span className="message-time">{formatTime(message.timestamp || new Date())}</span>
      </div>
      
      {!isUser && (
        <button className="tts-play-btn" onClick={() => speak(message.content)} aria-label="Read aloud">
          🔊
        </button>
      )}
    </div>
  );
};

export default MessageBubble;
