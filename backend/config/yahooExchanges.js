/**
 * yahooExchanges.js
 *
 * This file exists for ONE reason only:
 * Yahoo Finance uses different internal codes than TradingView for a handful of
 * major exchanges. For everything else, Yahoo's exchange code IS the TradingView
 * prefix and the dynamic fallback in normalizeYahooExchange handles it automatically.
 *
 * ONLY add entries here when:
 *   Yahoo's raw exchange code !== TradingView's exchange prefix
 *
 * Examples of where they differ:
 *   Yahoo "NMS" → TradingView "NASDAQ"  (not "NMS")
 *   Yahoo "NSI" → TradingView "NSE"     (not "NSI")
 *   Yahoo "TKS" → TradingView "TSE"     (not "TKS")
 *   Yahoo "GER" → TradingView "XETR"    (not "GER")
 *
 * Examples of where they match (NO entry needed — dynamic fallback handles):
 *   Yahoo "ASX"  → TradingView "ASX"    ✓
 *   Yahoo "BVC"  → TradingView "BVC"    ✓
 *   Yahoo "HKG"  → handled via .HK suffix
 *   Yahoo "LSE"  → TradingView "LSE"    ✓
 */

// Only entries where Yahoo code ≠ TradingView prefix
const YAHOO_CODE_CORRECTIONS = {
  // USA — Yahoo uses tier codes (NMS=NasdaqGS, NGM=NasdaqGM, NCM=NasdaqCM)
  "NMS": "NASDAQ",
  "NGM": "NASDAQ",
  "NCM": "NASDAQ",
  "NYQ": "NYSE",
  "PCX": "NYSE",    // NYSE Arca
  "CBT": "CBOE",

  // India — Yahoo uses "NSI" not "NSE"
  "NSI": "NSE",

  // Japan — Yahoo uses "TKS" not "TSE"
  "TKS": "TSE",
  "JPX": "TSE",

  // Germany — Yahoo uses "GER" not "XETR"
  "GER": "XETR",

  // Switzerland — Yahoo uses "EBS" not "SIX"
  "EBS": "SIX",

  // South Korea — Yahoo uses "KSC" for KSE and "KOE" for KOSDAQ
  "KSC": "KRX",
  "KOE": "KOSDAQ",

  // Hong Kong — Yahoo uses "HKG" not "HKEX"
  "HKG": "HKEX",

  // Brazil — Yahoo uses "SAO" not "BOVESPA"
  "SAO": "BOVESPA",

  // Singapore — Yahoo uses "SES" not "SGX"
  "SES": "SGX",

  // Taiwan — Yahoo uses "TAI" not "TWSE"
  "TAI": "TWSE",
  "TWO": "TPEX",   // Taiwan OTC/GTSM

  // Indonesia — Yahoo uses "JKT" not "IDX"
  "JKT": "IDX",

  // Mexico — Yahoo uses "MEX" not "BMV"
  "MEX": "BMV",

  // Saudi Arabia — Yahoo uses "SAU" not "TADAWUL"
  "SAU": "TADAWUL",

  // Canada — Yahoo uses "TOR" not "TSX"
  "TOR": "TSX",
  "VAN": "TSXV",
  "CNQ": "CSE",

  // Crypto — Yahoo uses "CCC", TradingView uses "CRYPTO"
  "CCC": "CRYPTO",
};

// Symbol suffix → TradingView prefix
// Only needed for stocks where the exchange code alone is ambiguous or Yahoo's
// search results don't reliably return the exchange code (e.g. old OTC records).
const SUFFIX_TO_TV = {
  ".NS": "NSE",
  ".BO": "BSE",
  ".L":  "LSE",
  ".T":  "TSE",
  ".HK": "HKEX",
  ".DE": "XETR",
  ".SW": "SIX",
  ".PA": "EURONEXT",
  ".AS": "EURONEXT",
  ".MI": "MIL",
  ".MC": "BME",
  ".AX": "ASX",
  ".F":  "FRA",
  ".TO": "TSX",
  ".V":  "TSXV",
  ".CN": "CSE",
  ".NE": "NEO",
  ".SS": "SSE",
  ".SZ": "SZSE",
  ".KS": "KRX",      // South Korea KSE
  ".KQ": "KOSDAQ",   // South Korea KOSDAQ
  ".SA": "BOVESPA",  // Brazil
  ".SI": "SGX",      // Singapore
  ".TW": "TWSE",     // Taiwan
  ".TWO": "TPEX",    // Taiwan OTC
  ".JK": "IDX",      // Indonesia
  ".MX": "BMV",      // Mexico
  ".SR": "TADAWUL",  // Saudi Arabia
  ".BK": "SET",      // Thailand
  ".JO": "JSE",      // South Africa
};

/**
 * Builds the TradingView symbol from Yahoo's raw symbol and exchange code.
 *
 * Priority order:
 *  1. Index special-cases (^NSEI, ^BSESN)
 *  2. Crypto (BTC-USD → CRYPTO:BTCUSD)
 *  3. Correct Yahoo exchange code if it differs from TradingView (via YAHOO_CODE_CORRECTIONS)
 *  4. Suffix-based mapping (.NS → NSE:, .L → LSE:)
 *  5. Generic: strip any remaining dot-suffix, use raw Yahoo exchange code as-is
 *     (works for BVC, ASX, HKG, TSX, etc. — they match TradingView natively)
 *
 * @param {string} yahooSymbol      - e.g. "RELIANCE.NS", "AAPL", "CELSIA.CL"
 * @param {string} yahooExchangeCode - e.g. "NSI", "NMS", "BVC", "CCC"
 * @returns {string} TradingView-compatible symbol string
 */
const buildTradingViewSymbol = (yahooSymbol, yahooExchangeCode) => {
  const sym = (yahooSymbol || "").toUpperCase();
  const exCode = (yahooExchangeCode || "").toUpperCase();

  // 1. Index overrides
  if (sym === "^NSEI")    return "NSE:NIFTY";
  if (sym === "^BSESN")   return "BSE:SENSEX";
  if (sym === "^NSEBANK") return "NSE:BANKNIFTY";

  // 2. Crypto
  if (exCode === "CCC" || sym.endsWith("-USD")) {
    return `CRYPTO:${sym.replace("-USD", "USD").replace(/-/g, "")}`;
  }

  // Strip dot-suffix from ticker to get the clean base ticker
  // e.g. "RELIANCE.NS" → "RELIANCE", "CELSIA.CL" → "CELSIA"
  const ticker = sym.replace(/\.[A-Z]{1,4}$/, "");

  // 3. Correct Yahoo's internal exchange code to TradingView prefix if they differ
  const tvPrefix = YAHOO_CODE_CORRECTIONS[exCode];
  if (tvPrefix) {
    return `${tvPrefix}:${ticker}`;
  }

  // 4. Suffix-based fallback (when exchange code isn't available, e.g. old DB records)
  for (const [suffix, prefix] of Object.entries(SUFFIX_TO_TV)) {
    if (sym.endsWith(suffix)) {
      return `${prefix}:${ticker}`;
    }
  }

  // 5. Generic fallback: Yahoo's exchange code IS the TradingView prefix
  //    Works for: BVC (Colombia), ASX (Australia), HKG→HKEX, TSX (Canada), BSE, LSE, etc.
  if (exCode && ticker !== sym) {
    // suffix was stripped — use exchange code as prefix
    return `${exCode}:${ticker}`;
  }
  if (exCode) {
    return `${exCode}:${ticker}`;
  }

  // Last resort: bare ticker (US stocks without prefix still resolve on TradingView)
  return ticker;
};

/**
 * Normalizes a Yahoo Finance exchange code to a canonical exchange + currency.
 * For codes not in our corrections table, returns the raw code itself — fully dynamic.
 *
 * @param {string} exchangeCode - Yahoo's raw exchange code (e.g. "NMS", "BVC", "ASX")
 * @returns {{ exchange: string, currency: string, tvPrefix: string }}
 */
const normalizeYahooExchange = (exchangeCode) => {
  if (!exchangeCode) return null;
  const exCode = exchangeCode.toUpperCase();

  // Apply correction if Yahoo's code differs from the canonical name
  const corrected = YAHOO_CODE_CORRECTIONS[exCode] || exCode;

  // Return canonical object — currency comes from Yahoo's q.currency at quote time,
  // so we just return "USD" as a safe fallback here (overridden in practice).
  return {
    exchange: corrected,
    tvPrefix: corrected === "CRYPTO" ? "CRYPTO" : corrected,
    market: { name: corrected === "NSE" || corrected === "BSE" ? "INDIA"
                   : corrected === "NASDAQ" || corrected === "NYSE" || corrected === "CBOE" ? "USA"
                   : corrected === "TSE" ? "JAPAN"
                   : corrected === "LSE" ? "UK"
                   : corrected === "CRYPTO" ? "CRYPTO"
                   : "GLOBAL",
              currency: "USD" },
  };
};

module.exports = { normalizeYahooExchange, buildTradingViewSymbol };
