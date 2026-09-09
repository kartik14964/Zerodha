const { normalizeYahooExchange } = require("../config/yahooExchanges");

/**
 * Normalizes a Yahoo Finance quote/search result into our canonical asset representation.
 */
const normalizeStock = (yahooResult) => {
  if (!yahooResult) return null;

  const exchangeMapping = normalizeYahooExchange(yahooResult.exchange);
  if (!exchangeMapping) return null; // Unsupported exchange

  return {
    symbol: yahooResult.symbol,
    name: yahooResult.longname || yahooResult.shortname || yahooResult.longName || yahooResult.shortName || yahooResult.symbol,
    market: exchangeMapping.market.name,
    exchange: exchangeMapping.exchange,
    exchangeCode: yahooResult.exchange,
    currency: yahooResult.currency || exchangeMapping.market.currency,
    timezone: exchangeMapping.market.timezone,
    assetType: yahooResult.quoteType || "EQUITY",
  };
};

module.exports = { normalizeStock };
