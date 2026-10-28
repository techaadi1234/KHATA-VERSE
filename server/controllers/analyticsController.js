import User from '../models/User.js';
import Transaction from '../models/Transaction.js';

// @desc    Get user's budget, total spend, and transaction breakdown
// @route   GET /api/analytics/summary
// @access  Private
export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const monthlyBudget = user.monthlyBudget || 1500;

    // Fetch all room transactions if the user is in a room
    let totalSpent = 0;
    let canteenSpent = 0;
    let roomSpent = 0;

    if (user.room) {
      const transactions = await Transaction.find({ room: user.room });

      transactions.forEach((tx) => {
        // Calculate user's share from memberOrders
        tx.memberOrders?.forEach((order) => {
          const orderUserId = order.user?._id || order.user;
          if (orderUserId.toString() === user._id.toString()) {
            totalSpent += order.subTotal || 0;
            canteenSpent += order.subTotal || 0;
          }
        });
      });
    }

    return res.json({
      monthlyBudget,
      totalSpent,
      canteenSpent,
      remainingBudget: Math.max(0, monthlyBudget - totalSpent),
      budgetExceeded: totalSpent > monthlyBudget,
    });
  } catch (error) {
    return next(error);
  }
};