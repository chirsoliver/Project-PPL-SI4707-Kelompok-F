import React from 'react';

function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
      <div className="message">
        <div className="message-text">{message.content}</div>
        
        {/* Render Context if it's a bot message and has context */}
        {!isUser && message.context && message.context.length > 0 && (
          <div className="message-context">
            <div className="context-title">Referensi Hukum:</div>
            {message.context.map((ctx, idx) => (
              <div key={idx} className="context-item">
                <div className="context-item-title">{ctx.title}</div>
                <div>{ctx.content}</div>
                <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: '#fca5a5' }}>
                  Sanksi: {ctx.penalty}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
