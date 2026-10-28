import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true
    },
    storedName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      default: 'application/pdf'
    },
    pageCount: {
      type: Number,
      default: 0
    },
    textLength: {
      type: Number,
      default: 0
    },
    chunkCount: {
      type: Number,
      default: 0
    },
    processingStatus: {
      type: String,
      enum: ['uploaded', 'processing', 'completed', 'failed'],
      default: 'uploaded'
    },
    errorMessage: {
      type: String,
      default: null
    },
    metadata: {
      author: String,
      title: String,
      creator: String,
      producer: String,
      creationDate: Date
    },
    embeddingModel: {
      type: String,
      default: null
    },
    vectorDimensions: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' }
  }
);

export const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
