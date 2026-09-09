const { MARKETS } = require("./markets");

// Maps Yahoo Finance exchange codes to our canonical exchanges
const YAHOO_EXCHANGE_MAP = {
  // USA
  "NMS": { market: MARKETS.USA, exchange: "NASDAQ" },
  "NYQ": { market: MARKETS.USA, exchange: "NYSE" },
  "NGM": { market: MARKETS.USA, exchange: "NASDAQ" },
  "NCM": { market: MARKETS.USA, exchange: "NASDAQ" },

  // INDIA
  "NSI": { market: MARKETS.INDIA, exchange: "NSE" },
  "BSE": { market: MARKETS.INDIA, exchange: "BSE" },

  // JAPAN
  "TKS": { market: MARKETS.JAPAN, exchange: "TSE" },
  "JPX": { market: MARKETS.JAPAN, exchange: "TSE" },

  // UK
  "LSE": { market: MARKETS.UK, exchange: "LSE" },
  "IOB": { market: MARKETS.UK, exchange: "LSE" },
};

const normalizeYahooExchange = (exchangeCode) => {
  return YAHOO_EXCHANGE_MAP[exchangeCode] || null;
};

module.exports = { YAHOO_EXCHANGE_MAP, normalizeYahooExchange };
