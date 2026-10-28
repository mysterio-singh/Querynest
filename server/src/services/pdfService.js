import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';

/**
 * Extracts text and metadata from a PDF file buffer or path
 * @param {string} filePath - Absolute or relative path to PDF file
 * @returns {Promise<{text: string, pageCount: number, pages: Array<{pageNumber: number, text: string}>, metadata: Object, isScanned: boolean}>}
 */
export const extractPdfData = async (filePath) => {
  try {
    const fileBuffer = await fs.readFile(filePath);

    // Verify PDF header magic bytes '%PDF-'
    const header = fileBuffer.subarray(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      throw new Error('Invalid file format: File header does not match a valid PDF document.');
    }

    const pages = [];
    const pagerender = (pageData) => {
      return pageData.getTextContent().then((textContent) => {
        let lastY = null;
        let pageText = '';
        for (const item of textContent.items) {
          if (lastY === item.transform[5] || lastY === null) {
            pageText += item.str;
          } else {
            pageText += '\n' + item.str;
          }
          lastY = item.transform[5];
        }
        pages.push({
          pageNumber: pageData.pageIndex + 1,
          text: pageText.trim()
        });
        return pageText;
      });
    };

    const parsedData = await pdfParse(fileBuffer, { pagerender });

    const fullText = (parsedData.text || '').trim();
    const pageCount = parsedData.numpages || (pages.length > 0 ? pages.length : 1);

    // Detect image-only or scanned documents:
    // If total text across all pages is under 40 characters or avg < 10 chars per page
    const isScanned = fullText.length < 40 || (fullText.length / pageCount < 10);

    return {
      text: fullText,
      pageCount,
      pages: pages.sort((a, b) => a.pageNumber - b.pageNumber),
      metadata: {
        author: parsedData.info?.Author || null,
        title: parsedData.info?.Title || null,
        creator: parsedData.info?.Creator || null,
        producer: parsedData.info?.Producer || null,
        creationDate: parsedData.info?.CreationDate ? new Date(parsedData.info.CreationDate) : null
      },
      isScanned
    };
  } catch (error) {
    logger.error(`PDF extraction error on ${filePath}:`, error.message);
    throw error;
  }
};
