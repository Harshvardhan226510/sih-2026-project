import React from 'react';
import { formatTime } from '../utils/formatters';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`message-bubble-container ${isUser ? 'user-container' : 'bot-container'}`}>
      <div className={`message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`}>
        <div className="message-content">
          <p>{message.content}</p>
        </div>
        <span className="message-time">{formatTime(message.timestamp || new Date())}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
