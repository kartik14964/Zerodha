const { MARKETS } = require("./markets");

// Maps Yahoo Finance exchange codes to our canonical exchanges
// tvPrefix: the TradingView exchange prefix for this exchange
const YAHOO_EXCHANGE_MAP = {
  // USA
  "NMS": { market: MARKETS.USA, exchange: "NASDAQ", tvPrefix: "NASDAQ" },
  "NYQ": { market: MARKETS.USA, exchange: "NYSE",   tvPrefix: "NYSE" },
  "NGM": { market: MARKETS.USA, exchange: "NASDAQ", tvPrefix: "NASDAQ" },
  "NCM": { market: MARKETS.USA, exchange: "NASDAQ", tvPrefix: "NASDAQ" },
  "PCX": { market: MARKETS.USA, exchange: "NYSE",   tvPrefix: "NYSE" },
  "CBT": { market: MARKETS.USA, exchange: "CBOE",   tvPrefix: "CBOE" },

  // INDIA
  "NSI": { market: MARKETS.INDIA, exchange: "NSE", tvPrefix: "NSE" },
  "BSE": { market: MARKETS.INDIA, exchange: "BSE", tvPrefix: "BSE" },

  // JAPAN
  "TKS": { market: MARKETS.JAPAN, exchange: "TSE", tvPrefix: "TSE" },
  "JPX": { market: MARKETS.JAPAN, exchange: "TSE", tvPrefix: "TSE" },

  // UK
  "LSE": { market: MARKETS.UK, exchange: "LSE", tvPrefix: "LSE" },
  "IOB": { market: MARKETS.UK, exchange: "LSE", tvPrefix: "LSE" },

  // EUROPE
  "GER": { market: MARKETS.EUROPE, exchange: "XETR",     tvPrefix: "XETR" },
  "FRA": { market: MARKETS.EUROPE, exchange: "FRA",      tvPrefix: "FRA" },
  "EBS": { market: MARKETS.EUROPE, exchange: "SIX",      tvPrefix: "SIX" },
  "PAR": { market: MARKETS.EUROPE, exchange: "EURONEXT", tvPrefix: "EURONEXT" },
  "AMS": { market: MARKETS.EUROPE, exchange: "EURONEXT", tvPrefix: "EURONEXT" },
  "MIL": { market: MARKETS.EUROPE, exchange: "MIL",      tvPrefix: "MIL" },
  "MCE": { market: MARKETS.EUROPE, exchange: "BME",      tvPrefix: "BME" },

  // AUSTRALIA
  "ASX": { market: MARKETS.AUSTRALIA, exchange: "ASX", tvPrefix: "ASX" },
  "CXA": { market: MARKETS.AUSTRALIA, exchange: "CXA", tvPrefix: "ASX" },

  // CANADA
  "TOR": { market: MARKETS.CANADA, exchange: "TSX", tvPrefix: "TSX" },
  "VAN": { market: MARKETS.CANADA, exchange: "TSXV", tvPrefix: "TSXV" },
  "CNQ": { market: MARKETS.CANADA, exchange: "CSE", tvPrefix: "CSE" },
  "NEO": { market: MARKETS.CANADA, exchange: "NEO", tvPrefix: "NEO" },

  // OTC
  "PNK": { market: MARKETS.OTC, exchange: "OTC", tvPrefix: "OTC" },
  "OQB": { market: MARKETS.OTC, exchange: "OTC", tvPrefix: "OTC" },

  // CHINA
  "HKG": { market: MARKETS.CHINA, exchange: "HKEX", tvPrefix: "HKEX" },
  "SHG": { market: MARKETS.CHINA, exchange: "SSE", tvPrefix: "SSE" },
  "SHZ": { market: MARKETS.CHINA, exchange: "SZSE", tvPrefix: "SZSE" },

  // CRYPTO
  "CCC": { market: MARKETS.CRYPTO, exchange: "CCC", tvPrefix: "CRYPTO" },
};

// Yahoo symbol-suffix -> TradingView prefix (fallback when exchange code unknown)
const SUFFIX_TO_TV = {
  ".NS": "NSE",
  ".BO": "BSE",
  ".DE": "XETR",
  ".L":  "LSE",
  ".SW": "SIX",
  ".T":  "TSE",
  ".HK": "HKEX",
  ".PA": "EURONEXT",
  ".AS": "EURONEXT",
  ".MI": "MIL",
  ".MC": "BME",
  ".AX": "ASX",
  ".F":  "FRA",
  ".V":  "TSXV",
  ".TO": "TSX",
  ".CN": "CSE",
  ".NE": "NEO",
  ".SS": "SSE",
  ".SZ": "SZSE",
};

/**
 * Computes the TradingView symbol from Yahoo quote data.
 * Priority: index specials -> crypto -> exchange map -> suffix fallback -> raw
 * @param {string} yahooSymbol - e.g. "RELIANCE.NS", "BTC-USD", "^NSEI"
 * @param {string} yahooExchangeCode - e.g. "NSI", "NMS", "CCC"
 * @returns {string} TradingView-compatible symbol string
 */
const buildTradingViewSymbol = (yahooSymbol, yahooExchangeCode) => {
  const sym = (yahooSymbol || "").toUpperCase();

  // Index overrides
  if (sym === "^NSEI")    return "NSE:NIFTY";
  if (sym === "^BSESN")   return "BSE:SENSEX";
  if (sym === "^NSEBANK") return "NSE:BANKNIFTY";

  // Crypto: BTC-USD -> CRYPTO:BTCUSD
  const mapping = normalizeYahooExchange(yahooExchangeCode);
  if (mapping && mapping.tvPrefix === "CRYPTO") {
    return `CRYPTO:${sym.replace("-USD", "USD").replace("-", "")}`;
  }
  if (sym.endsWith("-USD")) {
    return `CRYPTO:${sym.replace("-USD", "USD")}`;
  }

  // Strip Yahoo suffix to get clean ticker
  let ticker = sym;
  for (const suffix of Object.keys(SUFFIX_TO_TV)) {
    if (sym.endsWith(suffix)) {
      ticker = sym.slice(0, -suffix.length);
      break;
    }
  }

  // Use exchange map (most accurate)
  if (mapping && mapping.tvPrefix) {
    return `${mapping.tvPrefix}:${ticker}`;
  }

  // Suffix fallback
  for (const [suffix, prefix] of Object.entries(SUFFIX_TO_TV)) {
    if (sym.endsWith(suffix)) {
      return `${prefix}:${ticker}`;
    }
  }

  // Raw (US stocks like AAPL, TSLA resolve fine on TradingView without prefix)
  return ticker;
};

const normalizeYahooExchange = (exchangeCode) => {
  if (!exchangeCode) return null;
  
  const mapped = YAHOO_EXCHANGE_MAP[exchangeCode];
  if (mapped) return mapped;

  // Dynamic fallback for any unknown global exchange
  return {
    market: {
      name: "GLOBAL",
      exchanges: [exchangeCode],
      currency: "USD", // Safe fallback; Yahoo's q.currency will override this in most places
      timezone: "UTC",
    },
    exchange: exchangeCode,
    tvPrefix: exchangeCode, // Often TradingView accepts the raw Yahoo exchange code as a prefix
  };
};

module.exports = { YAHOO_EXCHANGE_MAP, normalizeYahooExchange, buildTradingViewSymbol };
