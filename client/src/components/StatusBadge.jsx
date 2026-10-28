import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="badge badge-success">
          <CheckCircle2 size={12} />
          <span>Ready</span>
        </span>
      );
    case 'processing':
      return (
        <span className="badge badge-warning">
          <Loader2 size={12} className="spin-animation" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Processing</span>
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-error">
          <AlertCircle size={12} />
          <span>Failed</span>
        </span>
      );
    case 'uploaded':
    default:
      return (
        <span className="badge badge-violet">
          <Clock size={12} />
          <span>Uploaded</span>
        </span>
      );
  }
};
