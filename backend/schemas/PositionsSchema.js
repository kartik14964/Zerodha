const { Schema } = require("mongoose");

const PositionsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  product: String,
  name: String,
  symbol: String,
  exchange: String,
  market: String,
  currency: String,
  qty: Number,
  avg: Number,
  price: Number,
  net: String,
  day: String,
  isLoss: Boolean,
});

module.exports = { PositionsSchema };
