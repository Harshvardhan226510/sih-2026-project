import React from 'react';

const SuggestedQueries = ({ onSelect }) => {
  const suggestions = [
    "Crop advisory for Wheat",
    "Current weather in Nagpur",
    "Are there any cyclone alerts?",
    "Pesticides for cotton aphids"
  ];

  return (
    <div className="suggested-queries">
      {suggestions.map((query, index) => (
        <button 
          key={index} 
          className="query-pill"
          onClick={() => onSelect(query)}
        >
          {query}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQueries;
