import express from 'express';
import { createRoom, joinRoom, getMyRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/myroom', protect, getMyRoom);

export default router;
