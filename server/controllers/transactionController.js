import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import MenuItem from '../models/MenuItem.js';

// @desc    Record a new canteen run & split costs across room members
// @route   POST /api/transactions
// @access  Private
export const addTransaction = async (req, res, next) => {
  try {
    const { memberOrders } = req.body; // Array of { user: UserId, items: [{ menuItem, itemName, qty, price }] }

    if (!memberOrders || memberOrders.length === 0) {
      return res.status(400).json({ message: 'No orders provided for transaction' });
    }

    const payerUser = await User.findById(req.user._id);
    if (!payerUser || !payerUser.room) {
      return res.status(400).json({ message: 'You must be part of a room to split expenses.' });
    }

    const orderedIds = [
      ...new Set(
        memberOrders.flatMap((order) => (order.items || []).map((item) => String(item.menuItem)))
      ),
    ].filter(Boolean);

    if (orderedIds.length > 0) {
      const menuDocs = await MenuItem.find({ _id: { $in: orderedIds } });
      const unavailable = menuDocs.filter((item) => item.isAvailable === false);
      if (unavailable.length > 0) {
        const names = unavailable.map((item) => item.itemName).join(', ');
        return res.status(400).json({
          message: `${names} ran out at night canteen`,
        });
      }
    }

    // Process and calculate sub-totals for each friend
    let calculatedTotal = 0;
    const processedMemberOrders = memberOrders.map((order) => {
      const subTotal = order.items.reduce((acc, item) => acc + item.price * item.qty, 0);
      calculatedTotal += subTotal;
      return {
        user: order.user,
        items: order.items,
        subTotal,
      };
    });

    // Create the transaction log in DB
    const transaction = await Transaction.create({
      payer: req.user._id,
      room: payerUser.room,
      totalAmount: calculatedTotal,
      memberOrders: processedMemberOrders,
    });

    // Populate user details for returning clean response
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('payer', 'name email')
      .populate('memberOrders.user', 'name email');

    return res.status(201).json(populatedTransaction);
  } catch (error) {
    return next(error);
  }
};

// @desc    Get room's full ledger history
// @route   GET /api/transactions/room
// @access  Private
export const getRoomTransactions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.room) {
      return res.status(400).json({ message: 'User is not part of any room' });
    }

    const history = await Transaction.find({ room: user.room })
      .populate('payer', 'name email')
      .populate('memberOrders.user', 'name email')
      .sort({ createdAt: -1 });

    return res.json(history);
  } catch (error) {
    return next(error);
  }
};

// @desc    Get vendor sales report (Vendor tracking what got sold)
// @route   GET /api/transactions/vendor-summary
// @access  Private/Vendor
export const getVendorSummary = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'vendor') {
      return res.status(403).json({ message: 'Access denied: Vendor privilege required' });
    }

    // Return only sales-relevant data. Avoid exposing which students paid.
    const transactions = await Transaction.find({})
      .populate('payer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const safeTransactions = transactions.map((tx) => ({
      _id: tx._id,
      payer: tx.payer,
      totalAmount: tx.totalAmount,
      createdAt: tx.createdAt,
      memberOrders: (tx.memberOrders || []).map((order) => ({
        subTotal: order.subTotal,
        items: order.items,
      })),
    }));

    return res.json(safeTransactions);
  } catch (error) {
    return next(error);
  }
};