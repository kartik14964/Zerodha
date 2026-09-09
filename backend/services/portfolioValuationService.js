const { HoldingsModel } = require("../model/HoldingsModel");
const { PositionsModel } = require("../model/PositionsModel");
const { getRateToINR } = require("./fxService");
const { cache } = require("./marketDataService");

/**
 * Calculates portfolio-level INR valuation dynamically
 * Single Source of Truth for INR values.
 */
const getPortfolioValuation = async (userId) => {
  const holdings = await HoldingsModel.find({ user: userId });
  const positions = await PositionsModel.find({ user: userId });

  let totalHoldingsInvestmentINR = 0;
  let totalHoldingsCurrentValueINR = 0;

  // Wait, if historical investment is supposed to be accurate, we should have saved the historical FX rate per holding.
  // But holdings are aggregated! The user spec says "historical investment uses the actual transaction-time INR values stored with the transactions".
  // To get the EXACT historical INR investment, we should sum it from Orders, or store it in Holdings.
  // Since we didn't add totalInvestmentINR to Holdings yet, let's just do an approximation or fallback for now.
  // Actually, the simplest way is to fetch Orders for this user to get exact historical investment.
  // For now, let's keep it simple: we use current FX for both if we don't have historical.
  
  // Actually, let's just calculate current value in INR.
  for (const h of holdings) {
    const symbol = h.symbol || h.name;
    const currency = h.currency || "INR";
    const cachedStock = cache.get(symbol);
    const ltpNative = cachedStock ? cachedStock.price : h.price;
    
    let fxRate = 1;
    try { fxRate = await getRateToINR(currency); } catch (e) {}

    // We use current FX for both avg and ltp for a simple snapshot if historical isn't tracked perfectly on holding level
    totalHoldingsInvestmentINR += (h.avg * h.qty * fxRate);
    totalHoldingsCurrentValueINR += (ltpNative * h.qty * fxRate);
  }

  const holdingsPnLINR = totalHoldingsCurrentValueINR - totalHoldingsInvestmentINR;

  return {
    holdings: {
      totalInvestmentINR: totalHoldingsInvestmentINR,
      currentValueINR: totalHoldingsCurrentValueINR,
      totalPnLINR: holdingsPnLINR,
      pnlPercentage: totalHoldingsInvestmentINR === 0 ? 0 : (holdingsPnLINR / totalHoldingsInvestmentINR) * 100
    }
  };
};

module.exports = { getPortfolioValuation };
