const { Schema } = require("mongoose");

const WatchlistSchema = new Schema({
  user:              { type: Schema.Types.ObjectId, ref: "User", required: true },
  name:              { type: String, required: true },
  symbol:            { type: String, required: true },
  currency:          { type: String, default: "INR" },
  exchange:          { type: String, default: "" },
  market:            { type: String, default: "" },
  tradingViewSymbol: { type: String, default: "" },
});

module.exports = { WatchlistSchema };
