import { Router } from 'express';
import {
  uploadAndProcessDocument,
  getDocuments,
  getDocumentById,
  deleteDocument
} from '../controllers/documentController.js';
import { uploadPdf } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/upload', uploadPdf.single('file'), uploadAndProcessDocument);
router.get('/', getDocuments);
router.get('/:id', getDocumentById);
router.delete('/:id', deleteDocument);

export default router;
