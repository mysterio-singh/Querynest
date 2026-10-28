import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [health, setHealth] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [activeConversation, setActiveConversation] = useState({
    id: null,
    messages: []
  });
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [healthLoading, setHealthLoading] = useState(true);

  // Fetch system health
  const refreshHealth = useCallback(async () => {
    try {
      setHealthLoading(true);
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      setHealth({
        ready: false,
        services: {
          api: { status: 'offline', error: err.message },
          database: { status: 'unknown' },
          ollama: { status: 'unknown' }
        }
      });
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch document list
  const refreshDocuments = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const data = await api.getDocuments();
      if (data.success && Array.isArray(data.documents)) {
        setDocuments(data.documents);
        // If no selectedDoc and documents exist, set first completed doc as selected
        setSelectedDoc((current) => {
          if (!current && data.documents.length > 0) {
            const firstCompleted = data.documents.find((d) => d.processingStatus === 'completed') || data.documents[0];
            return firstCompleted;
          }
          if (current) {
            // Keep current doc synced with updated list
            const found = data.documents.find((d) => d._id === current._id);
            return found || (data.documents[0] || null);
          }
          return null;
        });
      }
    } catch (err) {
      // If db is not connected or endpoint returns 503, documents is empty
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshHealth();
    refreshDocuments();

    // Periodic check every 30 seconds
    const interval = setInterval(() => {
      refreshHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshHealth, refreshDocuments]);

  // Start new chat thread
  const startNewChat = (doc = null) => {
    if (doc) setSelectedDoc(doc);
    setActiveConversation({
      id: null,
      messages: []
    });
  };

  return (
    <AppContext.Provider
      value={{
        health,
        healthLoading,
        refreshHealth,
        documents,
        loadingDocs,
        refreshDocuments,
        selectedDoc,
        setSelectedDoc,
        activeConversation,
        setActiveConversation,
        startNewChat
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
