// Server Logging Utility

export const logger = {
  info: (message, meta) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [INFO] ${message}`, meta ? meta : '');
  },
  warn: (message, meta) => {
    const ts = new Date().toISOString();
    console.warn(`[${ts}] [WARN] ${message}`, meta ? meta : '');
  },
  error: (message, error) => {
    const ts = new Date().toISOString();
    console.error(`[${ts}] [ERROR] ${message}`, error ? error : '');
  },
  debug: (message, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      const ts = new Date().toISOString();
      console.debug(`[${ts}] [DEBUG] ${message}`, meta ? meta : '');
    }
  }
};
