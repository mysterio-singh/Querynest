import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  FileText,
  Trash2,
  MessageSquare,
  Upload,
  Calendar,
  Layers,
  HardDrive,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../services/api.js';
import { StatusBadge } from '../components/StatusBadge.jsx';
import { Modal } from '../components/Modal.jsx';
import { UploadBox } from '../components/UploadBox.jsx';

export const Documents = () => {
  const navigate = useNavigate();
  const { documents, loadingDocs, refreshDocuments, setSelectedDoc, startNewChat } = useApp();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [deleteModalDoc, setDeleteModalDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDelete = async () => {
    if (!deleteModalDoc) return;
    try {
      setDeleting(true);
      setActionError(null);
      await api.deleteDocument(deleteModalDoc._id);
      await refreshDocuments();
      setDeleteModalDoc(null);
    } catch (err) {
      setActionError(err.message || 'Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  const handleChatWithDoc = (doc) => {
    setSelectedDoc(doc);
    startNewChat(doc);
    navigate('/workspace');
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '40px 24px', width: '100%' }}>
      {/* Page Header */}
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
          <h1 style={{ fontSize: '2rem', marginBottom: '6px' }}>Document Knowledge Base</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage indexed PDF documents, inspect chunk stats, or launch grounded chat sessions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => refreshDocuments()}
            className="btn-secondary"
            title="Refresh document list"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="btn-primary"
          >
            <Upload size={16} />
            <span>Upload PDF</span>
          </button>
        </div>
      </div>

      {/* Action Error Banner */}
      {actionError && (
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
          <span>{actionError}</span>
        </div>
      )}

      {/* Document Grid / Table */}
      {loadingDocs ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
          <div className="spin-animation" style={{ animation: 'spin 1.2s linear infinite', display: 'inline-block', marginBottom: '12px' }}>
            <RefreshCw size={28} color="var(--accent-violet)" />
          </div>
          <p>Loading documents from MongoDB Atlas...</p>
        </div>
      ) : documents.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '60px 24px',
            textAlign: 'center',
            maxWidth: '640px',
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
            <FolderOpen size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: '#FFFFFF' }}>
            No documents in your workspace
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            Upload your first PDF document to parse text, extract pages, and create vector embeddings with Ollama.
          </p>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="btn-primary"
          >
            <Upload size={16} />
            <span>Upload First PDF</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {documents.map((doc) => (
            <div
              key={doc._id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(154, 139, 250, 0.35)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(154, 139, 250, 0.12)',
                      color: 'var(--accent-violet)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <StatusBadge status={doc.processingStatus} />
                </div>

                <h3
                  style={{
                    fontSize: '1.1rem',
                    marginBottom: '8px',
                    color: '#FFFFFF',
                    wordBreak: 'break-word',
                    lineHeight: 1.4
                  }}
                  title={doc.originalName}
                >
                  {doc.originalName}
                </h3>

                {doc.errorMessage && (
                  <div
                    style={{
                      margin: '10px 0',
                      padding: '8px 10px',
                      background: 'rgba(244, 63, 94, 0.1)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: '#FDA4AF'
                    }}
                  >
                    {doc.errorMessage}
                  </div>
                )}

                {/* Metadata Items */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    margin: '16px 0',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <HardDrive size={14} color="var(--text-muted)" />
                    <span>File size: {formatFileSize(doc.fileSize)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={14} color="var(--text-muted)" />
                    <span>
                      {doc.pageCount || 1} pages &bull; {doc.chunkCount || 0} vector chunks
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} color="var(--text-muted)" />
                    <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  marginTop: '8px'
                }}
              >
                <button
                  onClick={() => handleChatWithDoc(doc)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                  disabled={doc.processingStatus !== 'completed'}
                >
                  <MessageSquare size={14} />
                  <span>Chat With Doc</span>
                </button>

                <button
                  onClick={() => setDeleteModalDoc(doc)}
                  className="btn-danger"
                  title="Delete document and chunks"
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <Modal
          title="Upload PDF Document"
          subtitle="Extract text, generate embeddings, and index into Atlas Vector Search"
          onClose={() => setUploadModalOpen(false)}
        >
          <div style={{ marginTop: '12px' }}>
            <UploadBox
              onUploadSuccess={(doc) => {
                setUploadModalOpen(false);
              }}
            />
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalDoc && (
        <Modal
          title="Confirm Document Deletion"
          onClose={() => !deleting && setDeleteModalDoc(null)}
        >
          <div style={{ marginTop: '12px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '20px' }}>
              Are you sure you want to delete <strong style={{ color: '#FFFFFF' }}>"{deleteModalDoc.originalName}"</strong>?
              This will permanently remove the document metadata, all indexed text chunks, and vector embeddings from MongoDB Atlas.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setDeleteModalDoc(null)}
                className="btn-secondary"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger"
                style={{ padding: '8px 18px', background: 'var(--status-error)', color: '#FFFFFF' }}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
