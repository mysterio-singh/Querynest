import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error(`API Error [${req.method} ${req.originalUrl}]:`, err.message);

  let statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxMb = process.env.MAX_FILE_SIZE_MB || '15';
      message = `Uploaded file exceeds the maximum permitted limit of ${maxMb}MB.`;
    }
  }

  // Handle CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found: Invalid ID format provided.';
  }

  // Return consistent JSON response
  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
};
