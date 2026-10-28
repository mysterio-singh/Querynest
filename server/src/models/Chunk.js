import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    embedding: {
      type: [Number],
      required: true,
      default: []
    },
    pageNumber: {
      type: Number,
      default: 1
    },
    wordCount: {
      type: Number,
      default: 0
    },
    startChar: {
      type: Number,
      default: 0
    },
    endChar: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

chunkSchema.index({ documentId: 1, chunkIndex: 1 });

export const Chunk = mongoose.models.Chunk || mongoose.model('Chunk', chunkSchema);
