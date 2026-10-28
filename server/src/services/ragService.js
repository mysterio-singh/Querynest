import { Document } from '../models/Document.js';
import { generateEmbedding, generateChatResponse, getOllamaConfig } from './ollamaService.js';
import { searchSimilarChunks } from './vectorService.js';
import { logger } from '../utils/logger.js';

/**
 * Orchestrates Retrieval-Augmented Generation (RAG) for document Q&A
 *
 * @param {Object} params
 * @param {string} params.documentId - Selected document ID
 * @param {string} params.question - User's question
 * @param {Array<{role: string, content: string}>} [params.conversationHistory=[]]
 * @returns {Promise<{answer: string, sources: Array<Object>, metadata: Object}>}
 */
export const answerQuestionWithRag = async ({ documentId, question, conversationHistory = [] }) => {
  if (!question || !question.trim()) {
    throw new Error('Question cannot be empty.');
  }

  if (!documentId) {
    throw new Error('A document must be selected to ask questions.');
  }

  // 1. Fetch document metadata
  const doc = await Document.findById(documentId);
  if (!doc) {
    throw new Error('Selected document was not found.');
  }

  if (doc.processingStatus !== 'completed') {
    throw new Error(`Selected document is not ready yet (Current status: ${doc.processingStatus}).`);
  }

  logger.info(`Processing RAG query for document "${doc.originalName}": "${question}"`);

  // 2. Generate embedding for user query
  const queryVector = await generateEmbedding(question.trim());

  // 3. Search for most relevant chunks
  const retrievalResult = await searchSimilarChunks({
    documentId,
    queryVector,
    topK: 4,
    minScore: 0.35
  });

  const chunks = retrievalResult.chunks || [];
  const { chatModel } = getOllamaConfig();

  // If no chunks were returned or top score is extremely low
  if (chunks.length === 0 || (chunks[0].score && chunks[0].score < 0.25)) {
    return {
      answer: `I could not find any relevant information in "${doc.originalName}" to answer your question. Please try asking about topics specifically discussed in this document.`,
      sources: [],
      metadata: {
        documentId: doc._id,
        documentName: doc.originalName,
        retrievalMethod: retrievalResult.method,
        chunksRetrieved: 0,
        model: chatModel,
        grounded: false
      }
    };
  }

  // 4. Construct grounded prompt with context excerpts
  const contextText = chunks
    .map(
      (c, idx) =>
        `[Excerpt ${idx + 1} | Page ${c.pageNumber || 'N/A'} | Chunk #${c.chunkIndex}]:\n${c.text.trim()}`
    )
    .join('\n\n');

  const systemPrompt = `You are QueryNest Assistant, an expert AI document knowledge assistant.
Your job is to answer the user's question truthfully, accurately, and strictly using the Document Excerpts provided below from the file "${doc.originalName}".

Strict Guidelines:
1. Base your answer solely on the provided Document Excerpts. Do NOT extrapolate or assume facts that are not explicitly stated.
2. If the excerpts do not contain the answer or cannot answer the question, state:
"I could not find the answer to this question in the selected document."
Do not guess or try to make up citations.
3. Be direct, clear, and professional. Use formatting (such as bullet points) where it helps readability.
4. Do not invent page numbers or citations.

Document Excerpts:
${contextText}`;

  // Build message history
  const messages = [
    { role: 'system', content: systemPrompt }
  ];

  // Include recent conversation context (up to last 4 messages) for continuity
  if (conversationHistory && conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-4);
    for (const msg of recent) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
  }

  // Add the current user question
  messages.push({ role: 'user', content: question.trim() });

  // 5. Generate grounded answer via Ollama
  const rawAnswer = await generateChatResponse(messages);

  // 6. Format source citations
  const sources = chunks.map((c) => ({
    chunkId: c._id,
    documentId: doc._id,
    documentName: doc.originalName,
    pageNumber: c.pageNumber || 1,
    chunkIndex: c.chunkIndex,
    excerpt: c.text.length > 280 ? c.text.substring(0, 280) + '...' : c.text,
    fullText: c.text,
    score: typeof c.score === 'number' ? Math.round(c.score * 100) / 100 : 0
  }));

  return {
    answer: rawAnswer,
    sources,
    metadata: {
      documentId: doc._id,
      documentName: doc.originalName,
      retrievalMethod: retrievalResult.method,
      chunksRetrieved: chunks.length,
      model: chatModel,
      grounded: true,
      notice: retrievalResult.notice || null
    }
  };
};
