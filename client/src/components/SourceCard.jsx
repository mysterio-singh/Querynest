import React, { useState } from 'react';
import { BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { Modal } from './Modal.jsx';

export const SourceCard = ({ source, index }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const percentage = typeof source.score === 'number' ? Math.round(source.score * 100) : null;

  return (
    <>
      <div className="source-card">
        <div className="source-meta-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <BookOpen size={13} />
            <span>
              Page {source.pageNumber || '1'} &bull; Chunk #{source.chunkIndex}
            </span>
          </span>
          {percentage !== null && percentage > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                background: 'rgba(107, 221, 209, 0.15)',
                color: 'var(--accent-teal)',
                padding: '1px 6px',
                borderRadius: '4px',
                fontSize: '0.72rem'
              }}
            >
              <Sparkles size={10} />
              {percentage}%
            </span>
          )}
        </div>

        <p className="source-excerpt">{source.excerpt}</p>

        {source.fullText && source.fullText.length > source.excerpt.length && (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              marginTop: '6px',
              fontSize: '0.75rem',
              color: 'var(--accent-violet)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <span>View passage</span>
            <ExternalLink size={11} />
          </button>
        )}
      </div>

      {modalOpen && (
        <Modal
          title={`Document Passage — Page ${source.pageNumber || '1'}`}
          subtitle={source.documentName || 'Document Excerpt'}
          onClose={() => setModalOpen(false)}
        >
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                background: 'var(--bg-deep)',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                maxHeight: '380px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {source.fullText || source.excerpt}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '16px',
                fontSize: '0.8rem',
                color: 'var(--text-muted)'
              }}
            >
              <span>Chunk #{source.chunkIndex}</span>
              {percentage !== null && <span>Relevance Score: {percentage}%</span>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
