import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { UploadBox } from '../components/UploadBox.jsx';
import { useApp } from '../context/AppContext.jsx';

export const Home = () => {
  const navigate = useNavigate();
  const { documents, selectedDoc, setSelectedDoc } = useApp();
  const [quickQuestion, setQuickQuestion] = useState('');

  const handleQuickAsk = (e) => {
    e.preventDefault();
    if (!quickQuestion.trim()) return;
    navigate('/workspace', { state: { initialQuestion: quickQuestion } });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Section */}
      <section className="hero-container">
        <div className="hero-pill">
          <Sparkles size={14} />
          <span>Next-Generation Document Knowledge Workspace</span>
        </div>

        <h1 className="hero-title">
          Your documents. <br />
          <span className="gradient-text-brand">Your answers.</span>
        </h1>

        <p className="hero-subtitle">
          QueryNest extracts, indexes, and searches deep within your complex PDF documents.
          Ask questions in plain English and receive precise, grounded answers backed by inspectable source citations.
        </p>

        {/* Action Buttons */}
        <div className="hero-actions">
          <button
            onClick={() => navigate('/workspace')}
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '1rem' }}
          >
            <span>Open Workspace</span>
            <ArrowRight size={18} />
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="btn-secondary"
            style={{ padding: '12px 24px', fontSize: '1rem' }}
          >
            <FileText size={18} />
            <span>Manage Documents ({documents.length})</span>
          </button>
        </div>

        {/* Quick Question Bar */}
        <div style={{ width: '100%', maxWidth: '780px', marginBottom: '40px' }}>
          <form onSubmit={handleQuickAsk} className="chat-input-box" style={{ padding: '10px 14px 10px 20px' }}>
            <Search size={18} color="var(--accent-violet)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              className="chat-input-field"
              placeholder={
                selectedDoc
                  ? `Ask a question about "${selectedDoc.originalName}"...`
                  : 'Ask any question across your uploaded documents...'
              }
              value={quickQuestion}
              onChange={(e) => setQuickQuestion(e.target.value)}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-lg)' }}
              disabled={!quickQuestion.trim()}
            >
              <span>Ask AI</span>
              <ArrowRight size={15} />
            </button>
          </form>
        </div>

        {/* Primary Upload Dropzone Card */}
        <div style={{ width: '100%', maxWidth: '780px', marginBottom: '50px' }}>
          <UploadBox
            onUploadSuccess={(newDoc) => {
              navigate('/workspace');
            }}
          />
        </div>

        {/* Approved Logo Showcase */}
        <div className="hero-banner-image">
          <img
            src="/querynest-logo.png"
            alt="QueryNest — Since 2026"
            style={{ maxHeight: '420px', objectFit: 'contain', margin: '0 auto' }}
          />
        </div>
      </section>

      {/* Feature Architecture Cards */}
      <section className="features-section">
        <div className="section-header">
          <span className="badge badge-teal" style={{ marginBottom: '12px' }}>
            Built For Accuracy
          </span>
          <h2 className="section-title">The QueryNest Advantage</h2>
          <p className="section-desc">
            No hallucinations. Every response is anchored in verified passages from your uploaded PDFs.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={26} />
            </div>
            <h3 className="feature-title">Grounded RAG Retrieval</h3>
            <p className="feature-desc">
              Answers are synthesized strictly from retrieved document chunks. If facts are absent, QueryNest
              explicitly reports that the answer could not be found instead of hallucinating.
            </p>
          </div>

          <div className="feature-card teal">
            <div className="feature-icon-wrapper">
              <Layers size={26} />
            </div>
            <h3 className="feature-title">Verifiable Source Citations</h3>
            <p className="feature-desc">
              Every grounded claim provides direct references to the document name, exact page number, chunk
              index, and relevance score so you can inspect evidence immediately.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Cpu size={26} />
            </div>
            <h3 className="feature-title">Local LLM + Cloud Vector Store</h3>
            <p className="feature-desc">
              Inference is driven locally on your device via Ollama (llama3.2:3b &amp; embeddinggemma), paired with
              high-performance MongoDB Atlas Vector Search for semantic retrieval.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
