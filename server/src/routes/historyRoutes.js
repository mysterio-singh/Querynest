import { Router } from 'express';
import {
  getConversations,
  getConversationById,
  deleteConversation
} from '../controllers/historyController.js';

const router = Router();

router.get('/', getConversations);
router.get('/:id', getConversationById);
router.delete('/:id', deleteConversation);

export default router;
