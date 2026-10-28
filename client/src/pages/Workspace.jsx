import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  FileText,
  Send,
  Plus,
  Loader2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Sparkles,
  Upload,
  Layers,
  ChevronRight,
  Database,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { ChatMessage } from '../components/ChatMessage.jsx';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { UploadBox } from '../components/UploadBox.jsx';

export const Workspace = () => {
  const location = useLocation();
  const {
    documents,
    selectedDoc,
    setSelectedDoc,
    activeConversation,
    setActiveConversation,
    startNewChat,
    health
  } = useApp();

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const chatScrollEndRef = useRef(null);

  // Check for initialQuestion passed from Home page or document click
  useEffect(() => {
    if (location.state?.initialQuestion && selectedDoc) {
      const q = location.state.initialQuestion;
      submitQuestion(q);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, selectedDoc]);

  // Scroll to bottom when messages update
  useEffect(() => {
    chatScrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation.messages, asking]);

  const submitQuestion = async (queryText = null) => {
    const textToSend = queryText || question;
    if (!textToSend.trim() || asking) return;

    if (!selectedDoc) {
      setChatError('Please select or upload a document to begin questioning.');
      return;
    }

    if (selectedDoc.processingStatus !== 'completed') {
      setChatError(`Document "${selectedDoc.originalName}" is still ${selectedDoc.processingStatus}. Please wait until indexing completes.`);
      return;
    }

    setChatError(null);
    setQuestion('');
    setAsking(true);

    // Add user message optimistically
    const userMsg = {
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date()
    };

    setActiveConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg]
    }));

    try {
      const res = await api.askQuestion({
        documentId: selectedDoc._id,
        question: textToSend.trim(),
        conversationId: activeConversation.id
      });

      if (res.success) {
        const assistantMsg = {
          role: 'assistant',
          content: res.answer,
          sources: res.sources || [],
          metadata: res.metadata || {},
          timestamp: new Date()
        };

        setActiveConversation((prev) => ({
          id: res.conversationId || prev.id,
          messages: [...prev.messages, assistantMsg]
        }));
      }
    } catch (err) {
      setChatError(err.message || 'Error communicating with the RAG pipeline.');
    } finally {
      setAsking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  };

  const suggestedQuestions = [
    'What is the executive summary or main theme of this document?',
    'What key methodologies or steps are explained in the text?',
    'What findings, conclusions, or recommendations are presented?'
  ];

  const dbConnected = health?.services?.database?.isConnected;
  const ollamaOnline = health?.services?.ollama?.isAvailable;

  return (
    <div className="workspace-layout">
      {/* Workspace Sidebar: Document Explorer */}
      <aside className="workspace-sidebar">
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--accent-violet)" />
            <span className="sidebar-title">Documents ({documents.length})</span>
          </div>
          <button
            onClick={() => setUploadModalOpen(true)}
            style={{
              padding: '5px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(154, 139, 250, 0.12)',
              color: 'var(--accent-violet)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}
            title="Upload new document"
          >
            <Plus size={14} />
            <span>Upload</span>
          </button>
        </div>

        <div className="doc-selector-list">
          {documents.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '0.82rem', marginBottom: '12px' }}>No documents uploaded yet.</p>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '6px 12px', margin: '0 auto' }}
              >
                <Upload size={13} />
                <span>Upload PDF</span>
              </button>
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedDoc?._id === doc._id;
              return (
                <button
                  key={doc._id}
                  onClick={() => {
                    setSelectedDoc(doc);
                    startNewChat(doc);
                  }}
                  className={`doc-item-btn ${isSelected ? 'selected' : ''}`}
                >
                  <FileText
                    size={17}
                    color={isSelected ? 'var(--accent-violet)' : 'var(--text-muted)'}
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="doc-item-title" title={doc.originalName}>
                      {doc.originalName}
                    </div>
                    <div className="doc-item-meta">
                      <span>{doc.pageCount ? `${doc.pageCount} pgs` : 'PDF'}</span>
                      {doc.chunkCount > 0 && <span>&bull; {doc.chunkCount} chunks</span>}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <StatusBadge status={doc.processingStatus} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(11, 14, 23, 0.4)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span>Inference:</span>
            <span style={{ color: ollamaOnline ? 'var(--status-online)' : 'var(--status-error)' }}>
              {ollamaOnline ? 'Ollama (Local)' : 'Offline'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Vector Index:</span>
            <span style={{ color: dbConnected ? 'var(--accent-teal)' : 'var(--status-warning)' }}>
              {dbConnected ? 'MongoDB Atlas' : 'Needs Config'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Chat Workspace Area */}
      <main className="chat-main">
        {/* Active Document Header Bar */}
        <div className="chat-header-bar">
          <div className="active-doc-banner">
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(154, 139, 250, 0.12)',
                color: 'var(--accent-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1rem', color: '#FFFFFF', fontWeight: 600 }}>
                  {selectedDoc ? selectedDoc.originalName : 'No Document Selected'}
                </h2>
                {selectedDoc && <StatusBadge status={selectedDoc.processingStatus} />}
              </div>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {selectedDoc
                  ? `${selectedDoc.pageCount || 1} pages &bull; ${selectedDoc.chunkCount || 0} indexed chunks &bull; Ready for grounded Q&A`
                  : 'Select a document from the left sidebar or upload a new PDF.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeConversation.messages.length > 0 && (
              <button
                onClick={() => startNewChat()}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                <Plus size={14} />
                <span>New Thread</span>
              </button>
            )}
            <Link
              to="/documents"
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              <Layers size={14} />
              <span>All Docs</span>
            </Link>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="chat-scroll-area">
          {activeConversation.messages.length === 0 ? (
            <div
              style={{
                maxWidth: '680px',
                margin: 'auto',
                textAlign: 'center',
                padding: '40px 20px'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--bg-navy-secondary)',
                  border: '1px solid rgba(154, 139, 250, 0.25)',
                  color: 'var(--accent-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px'
                }}
              >
                <Sparkles size={32} />
              </div>

              <h3 style={{ fontSize: '1.4rem', color: '#FFFFFF', marginBottom: '8px' }}>
                {selectedDoc ? `Ask about "${selectedDoc.originalName}"` : 'Welcome to QueryNest Workspace'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '32px', lineHeight: 1.6 }}>
                Every answer will be retrieved directly from your document's text chunks with verifiable
                page numbers and excerpts.
              </p>

              {selectedDoc && (
                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Suggested Questions
                  </span>
                  {suggestedQuestions.map((sq, idx) => (
                    <button
                      key={idx}
                      onClick={() => submitQuestion(sq)}
                      style={{
                        padding: '12px 16px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(154, 139, 250, 0.4)';
                        e.currentTarget.style.background = 'var(--bg-surface-elevated)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.background = 'var(--bg-surface)';
                      }}
                    >
                      <span>{sq}</span>
                      <ChevronRight size={15} color="var(--accent-violet)" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            activeConversation.messages.map((msg, idx) => (
              <ChatMessage key={idx} message={msg} />
            ))
          )}

          {/* AI Thinking Animation */}
          {asking && (
            <div className="message-bubble-wrapper assistant">
              <div className="avatar assistant">
                <img
                  src="/querynest-icon.png"
                  alt="AI"
                  style={{ width: '22px', height: '22px', borderRadius: '4px' }}
                />
              </div>
              <div className="message-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Loader2 size={18} style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-violet)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Searching vector chunks &amp; generating grounded response...
                </span>
              </div>
            </div>
          )}

          {/* Chat Error Banner */}
          {chatError && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(244, 63, 94, 0.12)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                color: '#FDA4AF',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.88rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#FFE4E6', marginBottom: '2px' }}>
                  Chat Request Notice
                </strong>
                <span>{chatError}</span>
              </div>
            </div>
          )}

          <div ref={chatScrollEndRef} />
        </div>

        {/* Bottom Anchored Input Box */}
        <div className="chat-input-bar-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitQuestion();
            }}
            className="chat-input-box"
          >
            <input
              type="text"
              className="chat-input-field"
              placeholder={
                selectedDoc
                  ? `Ask anything about "${selectedDoc.originalName}"...`
                  : 'Please select a document to start...'
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedDoc || asking}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!question.trim() || asking || !selectedDoc}
              aria-label="Send question"
            >
              {asking ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
            </button>
          </form>
          <div
            style={{
              textAlign: 'center',
              marginTop: '6px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)'
            }}
          >
            QueryNest grounds answers in retrieved document passages. Model citations can be inspected in each response.
          </div>
        </div>
      </main>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <Modal
          title="Upload PDF Document"
          subtitle="Add text-based PDFs for vector indexing and question answering"
          onClose={() => setUploadModalOpen(false)}
        >
          <div style={{ marginTop: '12px' }}>
            <UploadBox
              onUploadSuccess={(doc) => {
                setUploadModalOpen(false);
                startNewChat(doc);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
