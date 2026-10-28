import { answerQuestionWithRag } from '../services/ragService.js';
import { Conversation } from '../models/Conversation.js';
import { dbState } from '../config/db.js';
import { logger } from '../utils/logger.js';

export const askQuestion = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected. Chat retrieval requires an active database connection.'
    });
  }

  const { documentId, question, conversationId } = req.body;

  if (!question || !question.trim()) {
    return res.status(400).json({
      success: false,
      error: 'A question is required.'
    });
  }

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Please select a document to ask questions about.'
    });
  }

  try {
    let conv = null;
    let history = [];

    // Find conversation if ID provided
    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (conv) {
        history = conv.messages.map((m) => ({
          role: m.role,
          content: m.content
        }));
      }
    }

    // Call RAG pipeline
    const ragResult = await answerQuestionWithRag({
      documentId,
      question: question.trim(),
      conversationHistory: history
    });

    // Save to conversation history if database is available
    let activeConversationId = conversationId;

    if (!conv) {
      // Create new conversation thread
      const title = question.trim().length > 45 ? `${question.trim().slice(0, 42)}...` : question.trim();
      conv = await Conversation.create({
        title,
        documentId,
        messages: [
          {
            role: 'user',
            content: question.trim(),
            timestamp: new Date()
          },
          {
            role: 'assistant',
            content: ragResult.answer,
            sources: ragResult.sources,
            timestamp: new Date()
          }
        ]
      });
      activeConversationId = conv._id;
    } else {
      // Append to existing conversation
      conv.messages.push({
        role: 'user',
        content: question.trim(),
        timestamp: new Date()
      });
      conv.messages.push({
        role: 'assistant',
        content: ragResult.answer,
        sources: ragResult.sources,
        timestamp: new Date()
      });
      await conv.save();
    }

    res.json({
      success: true,
      answer: ragResult.answer,
      sources: ragResult.sources,
      conversationId: activeConversationId,
      metadata: ragResult.metadata
    });
  } catch (error) {
    logger.error('Error in askQuestion controller:', error.message);
    next(error);
  }
};
