import express from 'express';
import {
  createRoom,
  joinRoom,
  getMyRoom,
  getMyRooms,
  switchRoom,
  leaveRoom,
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/myroom', protect, getMyRoom);
router.get('/myrooms', protect, getMyRooms);
router.post('/switch/:roomId', protect, switchRoom);
router.post('/leave/:roomId', protect, leaveRoom);

export default router;