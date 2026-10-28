import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';
import { logger } from './utils/logger.js';
import { checkOllamaHealth } from './services/ollamaService.js';

const PORT = parseInt(process.env.PORT || '5000', 10);

const startServer = async () => {
  logger.info('========================================================');
  logger.info('              QUERYNEST AI RAG BACKEND                  ');
  logger.info('          "Your documents. Your answers."               ');
  logger.info('========================================================');

  // Attempt database connection
  await connectDB();

  // Check Ollama service availability
  const ollamaStatus = await checkOllamaHealth();
  if (ollamaStatus.isAvailable) {
    logger.info(`Ollama is ONLINE at ${ollamaStatus.url}. Installed models: [${ollamaStatus.models.join(', ')}]`);
  } else {
    logger.warn(`Ollama is NOT reachable at ${ollamaStatus.url}: ${ollamaStatus.error}`);
  }

  // Start HTTP listener
  app.listen(PORT, () => {
    logger.info(`QueryNest API listening on http://localhost:${PORT}`);
    logger.info(`Health check available at http://localhost:${PORT}/api/health`);
  });
};

// Global process error safety guards
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err.message);
});

startServer().catch((err) => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});
