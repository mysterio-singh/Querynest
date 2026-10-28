import fs from 'fs/promises';
import { Document } from '../models/Document.js';
import { Chunk } from '../models/Chunk.js';
import { Conversation } from '../models/Conversation.js';
import { extractPdfData } from '../services/pdfService.js';
import { chunkDocument } from '../services/chunkingService.js';
import { generateEmbedding, getOllamaConfig, checkOllamaHealth } from '../services/ollamaService.js';
import { dbState } from '../config/db.js';
import { logger } from '../utils/logger.js';

export const uploadAndProcessDocument = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas database is not connected. Please verify your MONGODB_URI in server/.env.'
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No PDF file was uploaded.'
    });
  }

  const { path: filePath, originalname, size, mimetype, filename } = req.file;
  let createdDoc = null;

  try {
    logger.info(`Received PDF upload: ${originalname} (${size} bytes)`);

    // 1. Create initial document record in Atlas
    createdDoc = await Document.create({
      originalName: originalname,
      storedName: filename,
      fileSize: size,
      mimeType: mimetype,
      processingStatus: 'processing'
    });

    // 2. Extract text and page structure
    const pdfData = await extractPdfData(filePath);

    if (pdfData.isScanned) {
      createdDoc.processingStatus = 'failed';
      createdDoc.errorMessage =
        'This PDF appears to be scanned or contains only image pages without selectable text. QueryNest currently requires machine-readable text PDFs (OCR support is planned for a future release).';
      createdDoc.pageCount = pdfData.pageCount;
      await createdDoc.save();

      // Clean up file
      await fs.unlink(filePath).catch(() => {});

      return res.status(422).json({
        success: false,
        error: createdDoc.errorMessage,
        document: createdDoc
      });
    }

    // 3. Chunk text with page mapping
    const chunks = chunkDocument(pdfData.pages, pdfData.text);

    if (chunks.length === 0) {
      createdDoc.processingStatus = 'failed';
      createdDoc.errorMessage = 'No extractable text segments could be identified from this document.';
      await createdDoc.save();

      await fs.unlink(filePath).catch(() => {});

      return res.status(422).json({
        success: false,
        error: createdDoc.errorMessage,
        document: createdDoc
      });
    }

    // 4. Check Ollama availability & generate embeddings for each chunk
    const { embedModel } = getOllamaConfig();
    const ollamaHealth = await checkOllamaHealth();
    if (!ollamaHealth.isAvailable) {
      createdDoc.processingStatus = 'failed';
      createdDoc.errorMessage = `Ollama is offline or not running at ${ollamaHealth.url}. Start Ollama and run: 'ollama pull ${embedModel}'`;
      await createdDoc.save().catch(() => {});
      await fs.unlink(filePath).catch(() => {});
      return res.status(503).json({
        success: false,
        error: createdDoc.errorMessage,
        document: createdDoc
      });
    }

    const chunkDocs = [];
    let vectorDim = null;

    logger.info(`Generating embeddings for ${chunks.length} chunks using '${embedModel}'...`);

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const embedding = await generateEmbedding(c.text);

      if (!vectorDim && Array.isArray(embedding)) {
        vectorDim = embedding.length;
      }

      chunkDocs.push({
        documentId: createdDoc._id,
        chunkIndex: c.chunkIndex,
        text: c.text,
        embedding,
        pageNumber: c.pageNumber,
        wordCount: c.wordCount
      });
    }

    // 5. Store chunks in MongoDB Atlas
    await Chunk.insertMany(chunkDocs);

    // 6. Update document status to completed
    createdDoc.pageCount = pdfData.pageCount;
    createdDoc.textLength = pdfData.text.length;
    createdDoc.chunkCount = chunkDocs.length;
    createdDoc.processingStatus = 'completed';
    createdDoc.embeddingModel = embedModel;
    createdDoc.vectorDimensions = vectorDim;
    createdDoc.metadata = pdfData.metadata;
    await createdDoc.save();

    // Clean up uploaded file
    await fs.unlink(filePath).catch(() => {});

    logger.info(`Successfully ingested "${originalname}": ${chunkDocs.length} chunks, dim ${vectorDim}`);

    res.status(201).json({
      success: true,
      message: `Document "${originalname}" processed and indexed successfully.`,
      document: createdDoc
    });
  } catch (error) {
    logger.error('Error during document upload/processing:', error.message);

    if (createdDoc) {
      createdDoc.processingStatus = 'failed';
      createdDoc.errorMessage = error.message;
      await createdDoc.save().catch(() => {});
      // Clean up orphaned chunks if any
      await Chunk.deleteMany({ documentId: createdDoc._id }).catch(() => {});
    }

    await fs.unlink(filePath).catch(() => {});
    next(error);
  }
};

export const getDocuments = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected. Configure MONGODB_URI in server/.env to view documents.'
    });
  }

  try {
    const documents = await Document.find().sort({ uploadedAt: -1 }).lean();
    res.json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected.'
    });
  }

  try {
    const { id } = req.params;
    const document = await Document.findById(id).lean();

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found.'
      });
    }

    const chunkSample = await Chunk.find({ documentId: id })
      .select('chunkIndex pageNumber wordCount text')
      .limit(5)
      .lean();

    res.json({
      success: true,
      document,
      sampleChunks: chunkSample
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected.'
    });
  }

  try {
    const { id } = req.params;
    const doc = await Document.findById(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found.'
      });
    }

    // Delete associated chunks
    const deletedChunks = await Chunk.deleteMany({ documentId: id });

    // Clean up or dissociate conversations
    await Conversation.deleteMany({ documentId: id });

    // Delete document record
    await Document.findByIdAndDelete(id);

    logger.info(`Deleted document "${doc.originalName}" and ${deletedChunks.deletedCount} associated chunks.`);

    res.json({
      success: true,
      message: `Document "${doc.originalName}" and ${deletedChunks.deletedCount} chunks were deleted.`,
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
};
