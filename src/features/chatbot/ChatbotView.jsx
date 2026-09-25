/**
 * ChatbotView — simply renders Module1View which now contains
 * the full sidebar + session management + Sarvam STT/TTS + multimodal.
 * All session state is managed inside a single useChat instance in Module1View.
 */
import Module1View from './Module1View.jsx';

export const ChatbotView = () => {
  return <Module1View />;
};

export default ChatbotView;
