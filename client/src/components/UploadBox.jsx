import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.jsx';

export const UploadBox = ({ onUploadSuccess }) => {
  const { refreshDocuments, setSelectedDoc } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file) => {
    setError(null);
    setSuccessMsg(null);

    // Validate client-side extension
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF document (.pdf).');
      return;
    }

    // 15MB limit check
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB maximum limit.');
      return;
    }

    try {
      setUploading(true);
      const res = await api.uploadDocument(file);

      if (res.success && res.document) {
        setSuccessMsg(`"${res.document.originalName}" processed and indexed (${res.document.chunkCount} chunks).`);
        await refreshDocuments();
        setSelectedDoc(res.document);
        if (onUploadSuccess) onUploadSuccess(res.document);
      }
    } catch (err) {
      setError(err.message || 'Failed to upload and index document.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          style={{ display: 'none' }}
          disabled={uploading}
        />

        <div className="upload-icon-circle">
          {uploading ? (
            <Loader2 size={32} style={{ animation: 'spin 1.2s linear infinite' }} />
          ) : (
            <UploadCloud size={32} />
          )}
        </div>

        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#FFFFFF' }}>
          {uploading ? 'Processing & Embedding PDF...' : 'Drop your PDF here, or browse files'}
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
          {uploading
            ? 'Extracting text structure, generating vector embeddings, and storing in Atlas...'
            : 'Supports text-searchable PDF documents up to 15MB.'}
        </p>

        {uploading && (
          <div
            style={{
              marginTop: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(154, 139, 250, 0.12)',
              color: 'var(--accent-violet)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <span>Analyzing text &amp; chunking</span>
          </div>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-online)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem'
          }}
        >
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 14px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#FDA4AF',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.86rem'
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ display: 'block', color: '#FFE4E6', marginBottom: '2px' }}>Upload Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
