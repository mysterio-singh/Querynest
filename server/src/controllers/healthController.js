import { dbState } from '../config/db.js';
import { checkOllamaHealth, getOllamaConfig } from '../services/ollamaService.js';
import { getVectorConfig } from '../services/vectorService.js';

export const getHealth = async (req, res, next) => {
  try {
    const ollamaStatus = await checkOllamaHealth();
    const ollamaConfig = getOllamaConfig();
    const vectorConfig = getVectorConfig();

    const services = {
      api: {
        status: 'online',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      database: {
        status: dbState.isConnected ? 'connected' : (dbState.uriConfigured ? 'connecting_or_failed' : 'not_configured'),
        provider: 'MongoDB Atlas (Cloud)',
        isConnected: dbState.isConnected,
        isConfigured: dbState.uriConfigured,
        databaseName: dbState.databaseName || null,
        error: dbState.error || null
      },
      ollama: {
        status: ollamaStatus.isAvailable ? 'online' : 'offline',
        runtime: 'Ollama (Local)',
        url: ollamaStatus.url,
        isAvailable: ollamaStatus.isAvailable,
        modelsInstalled: ollamaStatus.models,
        chatModel: ollamaConfig.chatModel,
        embedModel: ollamaConfig.embedModel,
        hasChatModel: ollamaStatus.hasChatModel,
        hasEmbedModel: ollamaStatus.hasEmbedModel,
        error: ollamaStatus.error
      },
      vectorSearch: {
        indexName: vectorConfig.indexName,
        dimensions: vectorConfig.dimensions,
        similarity: vectorConfig.similarity
      }
    };

    const isSystemReady = dbState.isConnected && ollamaStatus.isAvailable && ollamaStatus.hasChatModel && ollamaStatus.hasEmbedModel;

    res.json({
      success: true,
      ready: isSystemReady,
      app: 'QueryNest',
      tagline: 'Your documents. Your answers.',
      note: 'Ollama inference is executed locally; document metadata and vector search indices reside in MongoDB Atlas.',
      services
    });
  } catch (error) {
    next(error);
  }
};
