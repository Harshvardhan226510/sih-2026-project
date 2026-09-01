import React from 'react';
import Module1View from './features/chatbot/Module1View';
import './App.css'; // You can keep global styles if needed, or clear App.css

function ChatbotViewWrapper() {
  const { croppedSpatialContext, clearCroppedSpatialContext } = useWeather();

  return (
    <div className="app-container">
      {/* Since you want to test the chatbot module exclusively, we render it directly here */}
      <Module1View />
    </div>
  );
}

export function App() {
  const [activeTab, setActiveTab] = useState('gis-map');

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'gis-map':
        return <GisMapView onNavigateToChatbot={() => setActiveTab('chatbot')} />;
      case 'chatbot':
        return <ChatbotViewWrapper />;
      case 'alerts':
        return <Module3View />;
      case 'farmer-dashboard':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Agro-Meteorological Farmer Advisory</h2>
          </div>
        );
      case 'aviation-marine':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Aviation & Marine Weather Briefing</h2>
          </div>
        );
      case 'research-analytics':
        return (
          <div style={{ padding: 32, color: '#fff' }}>
            <h2>Climate Trends & Research Analytics</h2>
          </div>
        );
      default:
        return <GisMapView onNavigateToChatbot={() => setActiveTab('chatbot')} />;
    }
  };

  return (
    <WeatherProvider>
      <div className="weathergpt-app">
        <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="module-viewport">{renderActiveModule()}</main>
      </div>
    </WeatherProvider>
  );
}

export default App;


