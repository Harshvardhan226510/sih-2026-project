import React from 'react';

const AudioInput = ({ isRecording, onStart, onStop }) => {
  return (
    <button 
      className={`audio-input-btn ${isRecording ? 'recording' : ''}`}
      onMouseDown={onStart}
      onMouseUp={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      aria-label="Hold to speak"
    >
      <span className="mic-icon">🎤</span>
      {isRecording && <span className="pulse-ring"></span>}
    </button>
  );
};

export default AudioInput;
