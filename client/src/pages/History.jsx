import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  MessageSquare,
  FileText,
  Trash2,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';
import { Modal } from '../components/Modal.jsx';

export const History = () => {
  const navigate = useNavigate();
  const { setSelectedDoc, setActiveConversation, documents } = useApp();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalConv, setDeleteModalConv] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getHistory();
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      setError(err.message || 'Unable to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenConversation = async (conv) => {
    try {
      const res = await api.getConversationById(conv._id);
      if (res.success && res.conversation) {
        // Find document if exists
        if (conv.documentId) {
          const doc = documents.find((d) => d._id === conv.documentId);
          if (doc) setSelectedDoc(doc);
        }

        setActiveConversation({
          id: res.conversation._id,
          messages: res.conversation.messages || []
        });

        navigate('/workspace');
      }
    } catch (err) {
      setError(err.message || 'Failed to open conversation.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!deleteModalConv) return;
    try {
      setDeleting(true);
      await api.deleteConversation(deleteModalConv._id);
      setConversations((prev) => prev.filter((c) => c._id !== deleteModalConv._id));
      setDeleteModalConv(null);
    } catch (err) {
      setError(err.message || 'Failed to delete conversation.');
    } finally {
      setDeleting(false);
    }
  };

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
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Chat History</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Review past document interactions, inspection threads, and grounded answers.
          </p>
        </div>

        <button onClick={loadHistory} className="btn-secondary" title="Refresh history">
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          style={{
            marginBottom: '24px',
            padding: '12px 16px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FDA4AF',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.88rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Conversations List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div className="spin-animation" style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block', marginBottom: '12px' }}>
            <RefreshCw size={28} color="var(--accent-violet)" />
          </div>
          <p>Loading conversation threads...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '60px 24px',
            textAlign: 'center',
            maxWidth: '600px',
            margin: '0 auto'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(154, 139, 250, 0.12)',
              color: 'var(--accent-violet)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}
          >
            <HistoryIcon size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF' }}>
            No conversation history yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Your Q&amp;A sessions and citations will be saved here automatically when asking questions.
          </p>
          <button onClick={() => navigate('/workspace')} className="btn-primary">
            <MessageSquare size={16} />
            <span>Start a Chat in Workspace</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {conversations.map((conv) => (
            <div
              key={conv._id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px 22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(154, 139, 250, 0.3)';
                e.currentTarget.style.background = 'var(--bg-surface-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-surface)';
              }}
            >
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFFFFF', fontWeight: 600 }}>
                    {conv.title}
                  </h3>
                  <span className="badge badge-violet" style={{ fontSize: '0.7rem' }}>
                    {conv.messageCount} msgs
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FileText size={13} color="var(--accent-teal)" />
                    <span style={{ color: 'var(--accent-teal)' }}>{conv.documentName}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={13} />
                    <span>{new Date(conv.updatedAt).toLocaleDateString()}</span>
                  </span>
                </div>

                {conv.lastMessage && (
                  <p
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      marginTop: '8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '560px'
                    }}
                  >
                    "{conv.lastMessage}"
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => handleOpenConversation(conv)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <span>Resume</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={() => setDeleteModalConv(conv)}
                  className="btn-danger"
                  title="Delete conversation"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalConv && (
        <Modal
          title="Delete Conversation Thread"
          onClose={() => !deleting && setDeleteModalConv(null)}
        >
          <div style={{ marginTop: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>"{deleteModalConv.title}"</strong>?
              This chat thread will be permanently removed.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteModalConv(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConversation}
                className="btn-danger"
                style={{ padding: '8px 18px', background: 'var(--status-error)', color: '#FFFFFF' }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
