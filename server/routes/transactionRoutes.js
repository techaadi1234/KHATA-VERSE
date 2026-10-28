import express from 'express';
import {
  addTransaction,
  getRoomTransactions,
  getVendorSummary,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addTransaction);
router.get('/room', protect, getRoomTransactions);
router.get('/vendor-summary', protect, getVendorSummary);

export default router;