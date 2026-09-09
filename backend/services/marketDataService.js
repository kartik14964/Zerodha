const YahooFinance = require("yahoo-finance2").default;
const { normalizeYahooExchange, buildTradingViewSymbol } = require("../config/yahooExchanges");

// Configure yahoo-finance2 with a realistic browser User-Agent.
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  fetchOptions: {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  },
});

// Active symbols and their active subscriber count across all clients
const symbolCounts = new Map();
// The last known good price state (In-Memory Cache)
const cache = new Map();

let ioRef = null;
let isFetching = false;
let cooldownUntil = 0;

const initMarketDataService = (io) => {
  ioRef = io;
  // Poll Yahoo Finance every 5 seconds (minimum safe interval)
  setInterval(fetchAndBroadcast, 5000);
};

// ---------------------------------------------------------------------------
// Symbol subscription management
// ---------------------------------------------------------------------------
const addSymbols = (symbols) => {
  if (!symbols) return;
  symbols.forEach((symbol) => {
    symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
  });
};

const removeSymbols = (symbols) => {
  if (!symbols) return;
  symbols.forEach((symbol) => {
    const count = symbolCounts.get(symbol) || 0;
    if (count <= 1) {
      symbolCounts.delete(symbol);
    } else {
      symbolCounts.set(symbol, count - 1);
    }
  });
};

// ---------------------------------------------------------------------------
// Helper: convert Yahoo's marketState to a simple display status.
// Yahoo returns: REGULAR (open), PRE (pre-market), POST (post-market), CLOSED
// This is more accurate than local clock — Yahoo handles holidays, DST,
// and Japan's lunch break automatically.
// ---------------------------------------------------------------------------
const resolveMarketStatus = (marketState) => {
  if (!marketState) return "UNKNOWN";
  if (marketState === "REGULAR") return "OPEN";
  if (marketState === "PRE") return "PRE";
  if (marketState === "POST") return "POST";
  return "CLOSED";
};

// ---------------------------------------------------------------------------
// Fetch a batch of symbols and update the in-memory cache.
// Prices are stored in NATIVE currency (no forced INR conversion here).
// ---------------------------------------------------------------------------
const fetchBatch = async (symbolsToFetch) => {
  if (symbolsToFetch.length === 0) return [];

  if (Date.now() < cooldownUntil) {
    console.log("Yahoo Finance in cooldown. Serving from cache.");
    return symbolsToFetch.map(s => cache.get(s)).filter(Boolean);
  }

  const uniqueSymbols = [...new Set(symbolsToFetch)];

  try {
    const quotes = await yahooFinance.quote(uniqueSymbols);
    const results = Array.isArray(quotes) ? quotes : [quotes];

    const formatted = [];
    results.forEach((q) => {
      if (!q.regularMarketPrice) return;

      const exchangeMapping = normalizeYahooExchange(q.exchange);
      const exchange = exchangeMapping ? exchangeMapping.exchange : (q.exchange || "UNKNOWN");
      const market = exchangeMapping ? exchangeMapping.market.name : "UNKNOWN";

      // Use Yahoo's own marketState — handles holidays, DST, Japan lunch break automatically
      const marketStatus = resolveMarketStatus(q.marketState);

      const entry = {
        symbol: q.symbol,
        name: q.symbol,               // keep 'name' for backward compat with old watchlist code
        price: q.regularMarketPrice,  // NATIVE currency (USD stays USD, INR stays INR)
        nativePrice: q.regularMarketPrice,
        currency: q.currency || "INR",
        market: market,
        exchange: exchange,
        tradingViewSymbol: buildTradingViewSymbol(q.symbol, q.exchange), // pre-computed for TradingView
        marketStatus: marketStatus,   // "OPEN" | "CLOSED" | "PRE" | "POST"
        percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
        isDown: (q.regularMarketChangePercent || 0) < 0,
      };

      cache.set(q.symbol, entry);
      formatted.push(entry);
    });

    return formatted;
  } catch (err) {
    if (err.message && err.message.includes("429")) {
      console.warn("Yahoo Finance 429 Rate Limit hit. Entering 5-minute cooldown.");
      cooldownUntil = Date.now() + 5 * 60 * 1000;
    }
    throw err;
  }
};

// ---------------------------------------------------------------------------
// Polling loop — broadcast live prices and status to subscribed WebSocket clients
// ---------------------------------------------------------------------------
const fetchAndBroadcast = async () => {
  if (symbolCounts.size === 0 || isFetching) return;
  isFetching = true;

  const symbolsToFetch = Array.from(symbolCounts.keys());

  try {
    const results = await fetchBatch(symbolsToFetch);
    results.forEach((entry) => {
      if (ioRef) {
        ioRef.to(`stock:${entry.symbol}`).emit("price_update", entry);
      }
    });
  } catch (err) {
    console.error("Market Data Fetch Error (cache retained):", err.message);
  } finally {
    isFetching = false;
  }
};

// ---------------------------------------------------------------------------
// Initial quote fetch — called when a client connects and needs current prices
// ---------------------------------------------------------------------------
const getInitialQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];
  const unique = [...new Set(symbols)];
  const missing = unique.filter((s) => !cache.has(s));

  if (missing.length > 0 && !isFetching) {
    isFetching = true;
    try {
      await fetchBatch(missing);
    } catch (err) {
      console.error("Error fetching initial quotes:", err.message);
    } finally {
      isFetching = false;
    }
  }

  return unique.map((s) => cache.get(s)).filter(Boolean);
};

module.exports = {
  initMarketDataService,
  addSymbols,
  removeSymbols,
  getInitialQuotes,
  cache,
};
