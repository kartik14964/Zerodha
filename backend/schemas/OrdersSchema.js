const { Schema } = require("mongoose");

const OrdersSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  qty: Number,
  price: Number,
  mode: String,
  idempotencyKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

OrdersSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

module.exports = { OrdersSchema };
