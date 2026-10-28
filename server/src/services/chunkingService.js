import { logger } from '../utils/logger.js';

/**
 * Splits text into overlapping word-based chunks.
 * Preserves page numbering where page information is provided.
 *
 * @param {Array<{pageNumber: number, text: string}>} pages
 * @param {string} fullText
 * @param {Object} options
 * @param {number} options.chunkSizeWords - default 250 words (~1000 characters)
 * @param {number} options.chunkOverlapWords - default 50 words (~200 characters)
 * @returns {Array<{chunkIndex: number, text: string, pageNumber: number, wordCount: number}>}
 */
export const chunkDocument = (pages = [], fullText = '', options = {}) => {
  const chunkSizeWords = options.chunkSizeWords || parseInt(process.env.CHUNK_SIZE_WORDS || '250', 10);
  const chunkOverlapWords = options.chunkOverlapWords || parseInt(process.env.CHUNK_OVERLAP_WORDS || '50', 10);

  const chunks = [];
  let chunkIndex = 0;

  // If pages array is populated, chunk by pages to accurately attribute sources
  if (pages && pages.length > 0) {
    for (const page of pages) {
      const pageText = (page.text || '').trim();
      if (!pageText) continue;

      const words = pageText.split(/\s+/).filter(Boolean);

      if (words.length <= chunkSizeWords) {
        // Entire page fits in one chunk
        chunks.push({
          chunkIndex: chunkIndex++,
          text: words.join(' '),
          pageNumber: page.pageNumber,
          wordCount: words.length
        });
      } else {
        // Page needs splitting with overlap
        let start = 0;
        const step = Math.max(1, chunkSizeWords - chunkOverlapWords);

        while (start < words.length) {
          const slice = words.slice(start, start + chunkSizeWords);
          chunks.push({
            chunkIndex: chunkIndex++,
            text: slice.join(' '),
            pageNumber: page.pageNumber,
            wordCount: slice.length
          });
          start += step;
        }
      }
    }
  }

  // Fallback if pages array didn't generate chunks but fullText exists
  if (chunks.length === 0 && fullText && fullText.trim()) {
    const words = fullText.trim().split(/\s+/).filter(Boolean);
    let start = 0;
    const step = Math.max(1, chunkSizeWords - chunkOverlapWords);

    while (start < words.length) {
      const slice = words.slice(start, start + chunkSizeWords);
      chunks.push({
        chunkIndex: chunkIndex++,
        text: slice.join(' '),
        pageNumber: 1,
        wordCount: slice.length
      });
      start += step;
    }
  }

  logger.info(`Document chunked into ${chunks.length} chunks (chunkSize=${chunkSizeWords}, overlap=${chunkOverlapWords})`);
  return chunks;
};
