const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { getPortfolioValuation } = require("../services/portfolioValuationService");

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

const getValuation = async (req, res) => {
  try {
    const valuation = await getPortfolioValuation(req.user._id);
    res.json(valuation);
  } catch (err) {
    res.status(500).json({ error: "Failed to calculate valuation" });
  }
};

module.exports = { getAllHoldings, getAllPositions, getValuation };
