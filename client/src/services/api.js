// QueryNest API Client Service

const API_BASE = '/api';

/**
 * Helper to process JSON response and handle API errors cleanly
 */
const handleResponse = async (response) => {
  let data;
  try {
    data = await response.json();
  } catch (err) {
    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
    }
    return { success: true };
  }

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.statusCode = response.status;
    err.details = data;
    throw err;
  }

  return data;
};

export const api = {
  // Health & Services status
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return handleResponse(res);
  },

  // Document management
  getDocuments: async () => {
    const res = await fetch(`${API_BASE}/documents`);
    return handleResponse(res);
  },

  getDocumentById: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    return handleResponse(res);
  },

  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res);
  },

  deleteDocument: async (id) => {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  },

  // RAG Chat Question
  askQuestion: async ({ documentId, question, conversationId = null }) => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId,
        question,
        conversationId
      })
    });
    return handleResponse(res);
  },

  // Chat History
  getHistory: async () => {
    const res = await fetch(`${API_BASE}/history`);
    return handleResponse(res);
  },

  getConversationById: async (id) => {
    const res = await fetch(`${API_BASE}/history/${id}`);
    return handleResponse(res);
  },

  deleteConversation: async (id) => {
    const res = await fetch(`${API_BASE}/history/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res);
  }
};
