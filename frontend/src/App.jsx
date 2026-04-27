import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './components/ChatMessage';

function App() {
  const [messages, setMessages] = useState(() => {
    // Load from local storage
    const saved = localStorage.getItem('lentra_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        role: 'bot',
        content: 'Halo! Saya LENTRA AI (Legal Traffic AI), asisten hukum lalu lintas Indonesia Anda. Ada yang bisa saya bantu terkait aturan lalu lintas atau sanksi tilang?',
      }
    ];
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Save to local storage whenever messages change
  useEffect(() => {
    localStorage.setItem('lentra_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: userMsg.content }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const botMsg = {
        role: 'bot',
        content: data.answer,
        context: data.context
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Maaf, terjadi kesalahan saat menghubungi server. Pastikan backend dan Ollama (gemma3:4b) sedang berjalan secara lokal.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">LENTRA AI</h1>
        <div className="app-subtitle">Asisten Hukum Lalu Lintas Indonesia (Offline)</div>
      </header>

      <main className="chat-container">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="message">
              <div className="loading-indicator">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="input-container">
        <form className="input-form" onSubmit={handleSend}>
          <textarea
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pertanyaan Anda tentang aturan lalu lintas..."
            disabled={isLoading}
            rows={1}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={isLoading || !inputValue.trim()}
          >
            Kirim
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;
