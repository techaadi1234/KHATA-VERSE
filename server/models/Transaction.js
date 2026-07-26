import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    memberOrders: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        items: [
          {
            menuItem: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'MenuItem',
            },
            itemName: String,
            qty: { type: Number, default: 1 },
            price: Number,
          },
        ],
        subTotal: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;