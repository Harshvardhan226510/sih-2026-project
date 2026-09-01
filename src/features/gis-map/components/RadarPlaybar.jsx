import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Clock } from 'lucide-react';

export const RadarPlaybar = ({ radarFrames, currentFrameIndex, setCurrentFrameIndex, isPlaying, setIsPlaying, opacity, setOpacity }) => {
  useEffect(() => {
    let interval = null;
    if (isPlaying && radarFrames.length > 0) {
      interval = setInterval(() => {
        setCurrentFrameIndex((prevIndex) => (prevIndex + 1) % radarFrames.length);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying, radarFrames]);

  const currentFrame = radarFrames[currentFrameIndex];
  const formattedTime = currentFrame
    ? new Date(currentFrame.time * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '--:--';

  return (
    <div className="radar-playbar-card">
      <div className="playbar-top"> 
        <div className="time-display">
          <Clock size={16} className="text-cyan-400" />
          <span>Radar Timestamp: <strong>{formattedTime}</strong></span>
          <span className="live-pill">LIVE RADAR</span>
        </div>
        <div className="opacity-control">
          <span className="text-xs text-slate-300">Opacity:</span>
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="opacity-slider"
          />
        </div>
      </div>

      <div className="playbar-controls">
        <button
          className="ctrl-btn"
          onClick={() =>
            setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : radarFrames.length - 1))
          }
          title="Previous Frame"
        >
          <SkipBack size={16} />
        </button>

        <button
          className="play-btn"
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Animation' : 'Play Animation'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
        </button>

        <button
          className="ctrl-btn"
          onClick={() =>
            setCurrentFrameIndex((prev) => (prev + 1) % radarFrames.length)
          }
          title="Next Frame"
        >
          <SkipForward size={16} />
        </button>

        <input
          type="range"
          min="0"
          max={Math.max(0, radarFrames.length - 1)}
          value={currentFrameIndex}
          onChange={(e) => setCurrentFrameIndex(parseInt(e.target.value, 10))}
          className="timeline-slider"
        />
      </div>
    </div>
  );
};
