const { Schema } = require("mongoose");

const WatchlistSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
});

module.exports = { WatchlistSchema };
