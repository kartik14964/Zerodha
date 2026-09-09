const { WatchlistModel } = require("../model/WatchlistModel");

const getWatchlist = async (req, res) => {
  try {
    const watchlist = await WatchlistModel.find({ user: req.user._id }).sort({ _id: -1 });
    res.json(watchlist);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
};

const addToWatchlist = async (req, res) => {
  try {
    const { name, symbol } = req.body;
    const existing = await WatchlistModel.findOne({ user: req.user._id, name });
    
    if (existing) {
      return res.status(400).json({ message: "Stock already in watchlist" });
    }

    const newEntry = new WatchlistModel({
      user: req.user._id,
      name,
      symbol
    });
    
    await newEntry.save();
    res.json(newEntry);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to watchlist" });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    await WatchlistModel.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from watchlist" });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
