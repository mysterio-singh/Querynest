import mongoose from 'mongoose';
import { Chunk } from '../models/Chunk.js';
import { logger } from '../utils/logger.js';

export const getVectorConfig = () => ({
  indexName: process.env.VECTOR_INDEX_NAME || 'vector_index',
  dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '768', 10),
  similarity: 'cosine'
});

/**
 * Calculates cosine similarity between two numerical vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
};

/**
 * Searches for the most relevant chunks using MongoDB Atlas Vector Search
 * @param {Object} params
 * @param {string} params.documentId - Document to search within
 * @param {number[]} params.queryVector - The query vector from Ollama
 * @param {number} [params.topK=4] - Number of top chunks to retrieve
 * @param {number} [params.minScore=0.45] - Minimum similarity score threshold
 * @returns {Promise<{chunks: Array<Object>, method: string, indexName: string}>}
 */
export const searchSimilarChunks = async ({ documentId, queryVector, topK = 4, minScore = 0.45 }) => {
  const { indexName } = getVectorConfig();

  if (!queryVector || !Array.isArray(queryVector) || queryVector.length === 0) {
    throw new Error('Valid query embedding vector is required for vector search.');
  }

  const docObjectId = new mongoose.Types.ObjectId(documentId);

  // Attempt MongoDB Atlas Vector Search aggregation
  try {
    const pipeline = [
      {
        $vectorSearch: {
          index: indexName,
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: Math.max(topK * 10, 40),
          limit: topK,
          filter: {
            documentId: docObjectId
          }
        }
      },
      {
        $project: {
          _id: 1,
          documentId: 1,
          chunkIndex: 1,
          text: 1,
          pageNumber: 1,
          wordCount: 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ];

    const results = await Chunk.aggregate(pipeline);
    logger.info(`Atlas Vector Search returned ${results.length} chunks from index '${indexName}'`);

    if (results.length > 0) {
      const filtered = results.filter((r) => (r.score || 0) >= minScore);
      return {
        chunks: filtered.length > 0 ? filtered : results.slice(0, 2),
        method: 'atlas_vector_search',
        indexName
      };
    }

    // If Atlas Vector Search returned 0 chunks (e.g. index syncing), compute exact cosine similarity
    logger.info(`Atlas returned 0 chunks. Performing exact cosine similarity across document chunks...`);
    const docChunks = await Chunk.find({ documentId: docObjectId }).lean();
    if (docChunks.length > 0) {
      const scored = docChunks
        .map((chunk) => ({
          _id: chunk._id,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          wordCount: chunk.wordCount,
          score: cosineSimilarity(queryVector, chunk.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      const filtered = scored.filter((c) => c.score >= minScore);
      return {
        chunks: filtered.length > 0 ? filtered : scored.slice(0, 2),
        method: 'in_memory_cosine_fallback',
        indexName,
        notice: 'Retrieved via stored vector similarity.'
      };
    }

    return {
      chunks: [],
      method: 'atlas_vector_search',
      indexName
    };
  } catch (atlasError) {
    logger.warn(`Atlas $vectorSearch failed with message: ${atlasError.message}`);

    // Check if error is related to missing vector search index or cluster compatibility
    const isIndexMissing =
      atlasError.message.includes('Index not found') ||
      atlasError.message.includes('vector search index') ||
      atlasError.message.includes('$vectorSearch') ||
      atlasError.code === 26 ||
      atlasError.codeName === 'NamespaceNotFound' ||
      atlasError.code === 31105;

    if (isIndexMissing) {
      // Check if chunks exist in MongoDB for this document
      const chunkCount = await Chunk.countDocuments({ documentId: docObjectId });
      if (chunkCount === 0) {
        throw new Error('No chunks found for the selected document. Please re-upload or process the document.');
      }

      // Check if user has ALLOW_COSINE_FALLBACK=true in .env for development
      const allowCosineFallback = process.env.ALLOW_COSINE_FALLBACK === 'true';

      if (!allowCosineFallback) {
        // Return clear, actionable error instruction
        const instruction =
          `MongoDB Atlas Vector Search index '${indexName}' was not found or is still building in Atlas. ` +
          `To configure it in MongoDB Atlas: Go to Database -> Atlas Search / Vector Search -> Create Index -> JSON Editor -> ` +
          `Index Name: '${indexName}', Database/Collection: 'chunks', Definition: ` +
          `{"fields":[{"type":"vector","path":"embedding","numDimensions":${queryVector.length},"similarity":"cosine"},{"type":"filter","path":"documentId"}]}. ` +
          `Or set ALLOW_COSINE_FALLBACK=true in your .env for local vector calculation during testing.`;
        throw new Error(instruction);
      }

      // If user enabled local vector calculation fallback for development/testing:
      logger.info(`Fallback enabled: Computing exact in-memory cosine similarity across ${chunkCount} chunks.`);
      const chunks = await Chunk.find({ documentId: docObjectId }).lean();

      const scoredChunks = chunks
        .map((chunk) => ({
          _id: chunk._id,
          documentId: chunk.documentId,
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          wordCount: chunk.wordCount,
          score: cosineSimilarity(queryVector, chunk.embedding)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);

      const filtered = scoredChunks.filter((c) => c.score >= minScore);

      return {
        chunks: filtered.length > 0 ? filtered : scoredChunks.slice(0, 2),
        method: 'in_memory_cosine_dev_fallback',
        indexName,
        notice: `Atlas Vector index '${indexName}' not active; computed using in-memory cosine similarity.`
      };
    }

    throw atlasError;
  }
};
