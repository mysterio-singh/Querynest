import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  Server,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Code
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export const Settings = () => {
  const { health, healthLoading, refreshHealth } = useApp();
  const [copiedCode, setCopiedCode] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const db = health?.services?.database || {};
  const ollama = health?.services?.ollama || {};
  const apiInfo = health?.services?.api || {};
  const vector = health?.services?.vectorSearch || {};

  const atlasIndexJson = JSON.stringify(
    {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: vector.dimensions || 768,
          similarity: 'cosine'
        },
        {
          type: 'filter',
          path: 'documentId'
        }
      ]
    },
    null,
    2
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px'
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>System Architecture &amp; Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Inspect connection health, local LLM configurations, and cloud vector search indices.
          </p>
        </div>

        <button
          onClick={() => refreshHealth()}
          className="btn-secondary"
          disabled={healthLoading}
        >
          <RefreshCw
            size={16}
            style={{ animation: healthLoading ? 'spin 1s linear infinite' : 'none' }}
          />
          <span>{healthLoading ? 'Testing Connections...' : 'Test Connections'}</span>
        </button>
      </div>

      {/* Critical Architecture Callout */}
      <div
        style={{
          background: 'rgba(11, 42, 69, 0.4)',
          border: '1px solid rgba(107, 221, 209, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}
      >
        <ShieldAlert size={24} color="var(--accent-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-primary)' }}>
          <strong style={{ display: 'block', color: 'var(--accent-teal)', marginBottom: '4px', fontSize: '1rem' }}>
            Data Flow &amp; Privacy Boundary Note
          </strong>
          Ollama model inference (chat generation &amp; embeddings) executes <strong>locally on your machine</strong>.
          However, document metadata, chunk text, and embeddings are stored in <strong>MongoDB Atlas in the cloud</strong>.
          QueryNest is a hybrid local-inference / cloud-database architecture. Do not treat the database tier as 100% offline.
        </div>
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Backend API Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(154, 139, 250, 0.12)',
                  color: 'var(--accent-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Server size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>Express REST API</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backend Engine</span>
              </div>
            </div>
            <span className={`badge ${apiInfo.status === 'online' ? 'badge-success' : 'badge-error'}`}>
              {apiInfo.status === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Port / Base:</span>
              <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>http://localhost:5000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Uptime:</span>
              <span>{apiInfo.uptimeSeconds ? `${apiInfo.uptimeSeconds} seconds` : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(107, 221, 209, 0.12)',
                  color: 'var(--accent-teal)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Database size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>MongoDB Atlas</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cloud Database &amp; Search</span>
              </div>
            </div>
            <span
              className={`badge ${
                db.isConnected ? 'badge-success' : db.isConfigured ? 'badge-warning' : 'badge-error'
              }`}
            >
              {db.isConnected ? 'Connected' : db.isConfigured ? 'Connecting' : 'Needs Config'}
            </span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Database Name:</span>
              <span style={{ color: '#FFFFFF' }}>{db.databaseName || 'querynest'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Vector Index:</span>
              <span style={{ color: 'var(--accent-teal)' }}>{vector.indexName || 'vector_index'}</span>
            </div>
          </div>
        </div>

        {/* Ollama Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(154, 139, 250, 0.12)',
                  color: 'var(--accent-violet)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Cpu size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF' }}>Ollama Runtime</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Local Model Inference</span>
              </div>
            </div>
            <span className={`badge ${ollama.isAvailable ? 'badge-success' : 'badge-error'}`}>
              {ollama.isAvailable ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Endpoint:</span>
              <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{ollama.url || 'http://127.0.0.1:11434'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Chat Model:</span>
              <span style={{ color: ollama.hasChatModel ? 'var(--status-online)' : 'var(--status-warning)' }}>
                {ollama.chatModel || 'llama3.2:3b'} {ollama.hasChatModel ? '✓' : '(Not Pulled)'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Embed Model:</span>
              <span style={{ color: ollama.hasEmbedModel ? 'var(--status-online)' : 'var(--status-warning)' }}>
                {ollama.embedModel || 'embeddinggemma'} {ollama.hasEmbedModel ? '✓' : '(Not Pulled)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Instructions Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Ollama Terminal Setup */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Cpu size={22} color="var(--accent-violet)" />
            <h2 style={{ fontSize: '1.25rem' }}>1. Local Ollama Setup Instructions</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px', lineHeight: 1.6 }}>
            Download and install Ollama from <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-teal)', textDecoration: 'underline' }}>ollama.com</a>.
            After installing, pull the required chat and embedding models in your terminal:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chat Model (llama3.2:3b)
              </span>
              <div
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px'
                }}
              >
                <code style={{ color: 'var(--accent-violet)', fontSize: '0.9rem' }}>ollama run llama3.2:3b</code>
                <button
                  onClick={() => copyToClipboard('ollama run llama3.2:3b', 'chat-model')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  {copiedCode === 'chat-model' ? <Check size={13} color="var(--status-online)" /> : <Copy size={13} />}
                  <span>{copiedCode === 'chat-model' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Embedding Model (embeddinggemma)
              </span>
              <div
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px'
                }}
              >
                <code style={{ color: 'var(--accent-teal)', fontSize: '0.9rem' }}>ollama pull embeddinggemma</code>
                <button
                  onClick={() => copyToClipboard('ollama pull embeddinggemma', 'embed-model')}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                >
                  {copiedCode === 'embed-model' ? <Check size={13} color="var(--status-online)" /> : <Copy size={13} />}
                  <span>{copiedCode === 'embed-model' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MongoDB Atlas Setup & Vector Index Definition */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '28px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Database size={22} color="var(--accent-teal)" />
            <h2 style={{ fontSize: '1.25rem' }}>2. MongoDB Atlas Vector Search Index Setup</h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px', lineHeight: 1.6 }}>
            In your MongoDB Atlas cluster:
            1) Navigate to <strong>Atlas Search / Vector Search</strong> &rarr; <strong>Create Search Index</strong>.
            2) Select <strong>JSON Editor</strong>.
            3) Select database (e.g. <code>querynest</code>) and collection <code>chunks</code>.
            4) Set Index Name to <code>vector_index</code>.
            5) Paste the following index definition:
          </p>

          <div
            style={{
              position: 'relative',
              background: 'var(--bg-deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}
          >
            <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
              <button
                onClick={() => copyToClipboard(atlasIndexJson, 'atlas-json')}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              >
                {copiedCode === 'atlas-json' ? <Check size={13} color="var(--status-online)" /> : <Copy size={13} />}
                <span>{copiedCode === 'atlas-json' ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre style={{ margin: 0, fontSize: '0.85rem', color: '#E2E8F0', overflowX: 'auto', fontFamily: 'monospace' }}>
              {atlasIndexJson}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
