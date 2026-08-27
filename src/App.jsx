import React from 'react';
import Module1View from './features/chatbot/Module1View';
import './App.css'; // You can keep global styles if needed, or clear App.css

function App() {
  return (
    <div className="app-container">
      {/* Since you want to test the chatbot module exclusively, we render it directly here */}
      <Module1View />
    </div>
  );
}

export default App;
