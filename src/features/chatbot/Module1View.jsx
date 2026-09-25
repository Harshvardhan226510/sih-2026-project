import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import AudioInput from './components/AudioInput';
import SuggestedQueries from './components/SuggestedQueries';
import { useChat } from './hooks/useChat';
import { useSpeech } from './hooks/useSpeech';
import { useWeather } from '../../context/WeatherContext';

import './Module1View.css';

const Module1View = () => {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    sessions, 
    currentSessionId, 
    createNewSession, 
    switchSession, 
    deleteSession 
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [fileData, setFileData] = useState(null);
  const fileInputRef = useRef(null);
  
  const speakRef = useRef(null);

  const { croppedSpatialContext, clearCroppedSpatialContext } = useWeather();

  useEffect(() => {
    if (croppedSpatialContext) {
      createNewSession();
      
      if (croppedSpatialContext.fileData) {
        setFileData(croppedSpatialContext.fileData);
      }
      
      if (croppedSpatialContext.suggestedPrompt) {
        setInputText(croppedSpatialContext.suggestedPrompt);
      }
      
      clearCroppedSpatialContext();
    }
  }, [croppedSpatialContext, createNewSession, clearCroppedSpatialContext]);

  const handleSpeechResult = async (transcript) => {
    setInputText('');
    const replyObj = await sendMessage(transcript, fileData);
    setFileData(null); 
    if (replyObj && replyObj.text && speakRef.current) {
      speakRef.current(replyObj.text, replyObj.langCode);
    }
  };

  const lastBotMessage = [...messages].reverse().find(m => m.role === 'bot');
  const currentLangHint = lastBotMessage?.languageCode || 'en-IN';

  const { isRecording, startRecording, stopRecording, speak, stopAudio, isSpeaking } = useSpeech(handleSpeechResult, currentLangHint);
  
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      setFileData({
        base64: base64Data,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (inputText.trim() || fileData) {
      sendMessage(inputText || "Describe this file.", fileData);
      setInputText('');
      setFileData(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSuggestedQuery = (query) => {
    sendMessage(query, fileData);
    setFileData(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    /* The outer div is the full flex row: sidebar + chat area */
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden', background: '#fff' }}>

      {/* ===== LEFT SIDEBAR: Chat History ===== */}
      <div style={{
        width: '260px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        borderRight: '1px solid #e2e8f0',
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
          <button
            onClick={createNewSession}
            style={{
              width: '100%', padding: '8px 12px', background: '#2563eb',
              color: 'white', border: 'none', borderRadius: '10px',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1d4ed8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563eb'}
          >
            <span style={{ fontSize: '16px' }}>+</span> New Chat
          </button>
        </div>

        {/* Session List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, color: '#94a3b8',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            padding: '8px 8px 6px', 
          }}>
            Recent Conversations
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: '16px 8px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
              No chat history yet
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === currentSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 10px', borderRadius: '10px', cursor: 'pointer',
                    marginBottom: '2px', transition: 'background 0.15s ease',
                    background: isActive ? '#eff6ff' : 'transparent',
                    border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '13px', flexShrink: 0 }}>💬</span>
                  <span style={{
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontSize: '13px', color: isActive ? '#1d4ed8' : '#475569', fontWeight: isActive ? 600 : 400,
                  }}>
                    {session.title}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', fontSize: '16px', padding: '2px 4px',
                      borderRadius: '4px', opacity: 0.6, transition: 'opacity 0.15s, color 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.opacity = '0.6'; }}
                    title="Delete chat"
                  >
                    ×
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Multilingual footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0' }}>
          <div style={{
            background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
            padding: '10px 12px', fontSize: '11px', color: '#64748b',
          }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '3px' }}>🌐 Multilingual</div>
            <div>Hindi • English • Marathi</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Powered by Sarvam AI</div>
          </div>
        </div>
      </div>

      {/* ===== RIGHT: Chat Area ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'white' }}>

        {/* Scrollable chat window — flex: 1 so it takes remaining space */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ChatWindow 
            messages={messages} 
            isLoading={isLoading} 
            speak={speak}
            stopAudio={stopAudio}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Input area — pinned to bottom */}
        <div className="chatbot-input-area" style={{ flexShrink: 0 }}>
          <SuggestedQueries onSelect={handleSuggestedQuery} />
          
          <div className="input-group">
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
            <button 
              className="attach-btn" 
              onClick={() => fileInputRef.current?.click()}
              title="Attach Image or PDF"
            >
              📎
            </button>
            <AudioInput 
              isRecording={isRecording} 
              onStart={() => startRecording()} 
              onStop={stopRecording} 
            />
            <div className="text-input-container">
              {fileData && (
                <div className="attached-file-badge">
                  <span>{fileData.name}</span>
                  <button onClick={() => setFileData(null)}>×</button>
                </div>
              )}
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask in Hindi, English or Marathi..."
                className="chat-text-input"
              />
            </div>
            <button 
              onClick={handleSend} 
              disabled={isLoading || (!inputText.trim() && !fileData)} 
              className="send-btn"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Module1View;
