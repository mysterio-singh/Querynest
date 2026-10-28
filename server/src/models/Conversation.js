import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    chunkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chunk'
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    documentName: {
      type: String
    },
    pageNumber: {
      type: Number,
      default: 1
    },
    chunkIndex: {
      type: Number,
      default: 0
    },
    excerpt: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    sources: [sourceSchema],
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: 'New Conversation'
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null,
      index: true
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
