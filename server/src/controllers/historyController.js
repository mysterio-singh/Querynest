import { Conversation } from '../models/Conversation.js';
import { dbState } from '../config/db.js';

export const getConversations = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected.'
    });
  }

  try {
    const conversations = await Conversation.find()
      .populate('documentId', 'originalName')
      .sort({ updatedAt: -1 })
      .lean();

    const formatted = conversations.map((c) => ({
      _id: c._id,
      title: c.title,
      documentId: c.documentId?._id || c.documentId || null,
      documentName: c.documentId?.originalName || 'Unknown Document',
      messageCount: c.messages?.length || 0,
      lastMessage: c.messages?.[c.messages.length - 1]?.content || '',
      updatedAt: c.updatedAt,
      createdAt: c.createdAt
    }));

    res.json({
      success: true,
      count: formatted.length,
      conversations: formatted
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected.'
    });
  }

  try {
    const { id } = req.params;
    const conversation = await Conversation.findById(id)
      .populate('documentId', 'originalName pageCount fileSize')
      .lean();

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  if (!dbState.isConnected) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB Atlas is not connected.'
    });
  }

  try {
    const { id } = req.params;
    const deleted = await Conversation.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully.',
      deletedId: id
    });
  } catch (error) {
    next(error);
  }
};
