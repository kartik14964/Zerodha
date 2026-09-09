const { Schema } = require("mongoose");

const OrdersSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  symbol: String,
  exchange: String,
  market: String,
  currency: String,
  qty: Number,
  price: Number, // Legacy alias for orderPrice (or use orderPrice)
  orderPrice: Number, // Native execution price
  totalTransactionValueNative: Number,
  fxRateToINR: Number,
  totalTransactionValueINR: Number,
  mode: String,
  idempotencyKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

OrdersSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

module.exports = { OrdersSchema };
