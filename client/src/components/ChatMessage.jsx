import React, { useState } from 'react';
import { User, Copy, Check, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { SourceCard } from './SourceCard.jsx';

export const ChatMessage = ({ message }) => {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;
  const isUnfound =
    message.content.includes('could not find') ||
    message.content.includes('not found') ||
    (!hasSources && isAssistant);

  // Formatter for markdown-like bold and bullet points
  const formatContent = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      // Bold rendering
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ color: '#FFFFFF' }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      // Bullet lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={idx} style={{ marginLeft: '20px', marginBottom: '4px' }}>
            {renderedParts.slice(1)}
          </li>
        );
      }

      return (
        <p key={idx} style={{ marginBottom: line.trim() === '' ? '10px' : '6px' }}>
          {renderedParts}
        </p>
      );
    });
  };

  return (
    <div className={`message-bubble-wrapper ${isAssistant ? 'assistant' : 'user'}`}>
      <div className={`avatar ${isAssistant ? 'assistant' : 'user'}`}>
        {isAssistant ? (
          <img
            src="/querynest-icon.png"
            alt="AI"
            style={{ width: '22px', height: '22px', borderRadius: '4px' }}
          />
        ) : (
          <User size={18} />
        )}
      </div>

      <div className="message-content-container" style={{ maxWidth: '100%', flex: 1 }}>
        <div className={`message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
          {isAssistant && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
                paddingBottom: '6px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {hasSources ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--accent-teal)',
                      background: 'rgba(107, 221, 209, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    <ShieldCheck size={12} />
                    Grounded in Document
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: 'var(--text-muted)'
                    }}
                  >
                    <AlertCircle size={12} />
                    Context-Limited
                  </span>
                )}
              </div>

              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                title="Copy response"
              >
                {copied ? <Check size={13} color="var(--status-online)" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}

          <div style={{ wordBreak: 'break-word' }}>
            {formatContent(message.content)}
          </div>

          {/* Grounded Source Citations */}
          {hasSources && (
            <div className="source-section">
              <div className="source-header">
                <Sparkles size={13} />
                <span>Source References ({message.sources.length})</span>
              </div>
              <div className="sources-grid">
                {message.sources.map((src, sIdx) => (
                  <SourceCard key={sIdx} source={src} index={sIdx} />
                ))}
              </div>
            </div>
          )}
        </div>

        {message.timestamp && (
          <span className="message-timestamp">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};
