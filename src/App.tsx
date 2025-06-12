import './App.css';

import Login from './components/loginrightsidebar';
import ChatWidgetLauncher from './components/Button';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Login sidebar or main UI */}
      <Login />

      {/* Floating Chatbot launcher */}
      <ChatWidgetLauncher />
    </div>
  );
}

export default App;
