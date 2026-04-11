import mongoose from 'mongoose';

// Payment schema for transaction logging
const paymentSchema = new mongoose.Schema({
  // LINKS
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true }, // Which order
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // Who paid
  
  paymentId: { type: String, required: true, unique: true, index: true }, // Stripe PI (unique)

  // MONEY
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'BDT' },

  // STATUS
  status: {
    type: String,
    required: true,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'suspicious'],
    default: 'pending'
  },

  // METADATA
  paymentMethod: { type: String, required: true, enum: ['bkash', 'card', 'free'] },
  last4: String, // Card last 4 digits (for receipt)
  brand: { type: String, enum: ['visa', 'mastercard', 'amex', 'discover'] }, // Card brand

  // FAILURE (if failed)
  failureCode: String, // "insufficient_funds", "card_declined", etc.
  failureMessage: String,

  // REFUND (if refunded)
  refundId: String, // Stripe refund ID
  refundAmount: Number,
  refundedAt: Date,

  // GATEWAY TRANSACTION DETAILS
  transactionId: String,        // PayStation trx_id
  webhookReceived: { type: Boolean, default: false },
  webhookReceivedAt: Date,

  // SUSPICIOUS PAYMENT FLAGS
  suspiciousAt: Date,
  suspiciousReason: String,
  receivedAmount: Number,
  expectedAmount: Number,

  // TIMESTAMPS
  createdAt: { type: Date, default: Date.now },
  succeededAt: Date,
  failedAt: Date,
});

// Indexes for performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });


export default paymentSchema;