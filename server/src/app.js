import express from 'express';
import cors from 'cors';
import healthRoutes from './routes/healthRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();

// Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/api/health')) {
    logger.info(`${req.method} ${req.originalUrl}`);
  }
  next();
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    app: 'QueryNest API',
    tagline: 'Your documents. Your answers.',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: '/api/health',
      documents: '/api/documents',
      chat: '/api/chat',
      history: '/api/history'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

// Catch-all 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
