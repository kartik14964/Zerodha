const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");

const getAllHoldings = async (req, res) => {
  try {
    const tempHoldings = await HoldingsModel.find({ user: req.user._id });
    res.json(tempHoldings);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch holdings" });
  }
};

const getAllPositions = async (req, res) => {
  try {
    const userPositions = await PositionsModel.find({ user: req.user._id });
    res.json(userPositions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch positions" });
  }
};

module.exports = { getAllHoldings, getAllPositions };
