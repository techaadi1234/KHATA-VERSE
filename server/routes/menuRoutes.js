import express from 'express';
import { getMenuItems, addMenuItem, toggleItemAvailability } from '../controllers/menuController.js';
import { protect, vendorOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMenuItems);
router.post('/', protect, vendorOnly, addMenuItem);
router.patch('/:id/toggle', protect, vendorOnly, toggleItemAvailability);

export default router;