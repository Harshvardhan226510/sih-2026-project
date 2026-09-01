import React, { useState, useRef, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import AudioInput from './components/AudioInput';
import SuggestedQueries from './components/SuggestedQueries';
import { useChat } from './hooks/useChat';
import { useSpeech } from './hooks/useSpeech';

import './Module1View.css'; // Let's add some styles later

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

  return (
    <div className="chat-layout-clean w-full h-full flex flex-col bg-white">
      {/* Main Chat Area */}
      <div className="chatbot-container w-full h-full flex flex-col">
        <div className="chatbot-header px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center border border-gray-300 shadow-sm text-slate-700">
             🤖
          </div>
          <h2 className="text-lg font-bold text-gray-800">WeatherGPT Copilot</h2>
        </div>

      <div className="chatbot-main">
        <ChatWindow 
          messages={messages} 
          isLoading={isLoading} 
          speak={speak}
          stopAudio={stopAudio}
          isSpeaking={isSpeaking}
        />
        
        <div className="chatbot-input-area">
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
                placeholder="Ask a question..."
                className="chat-text-input"
              />
            </div>
            <button onClick={handleSend} disabled={isLoading || (!inputText.trim() && !fileData)} className="send-btn">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Module1View;
