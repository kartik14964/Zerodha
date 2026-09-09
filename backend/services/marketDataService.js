const YahooFinance = require("yahoo-finance2").default;

// Configure yahoo-finance2 with a realistic browser User-Agent.
// When deployed on cloud platforms like Render, Yahoo Finance blocks requests
// that look like automated server traffic (returning 429). A browser User-Agent
// significantly reduces the chance of being flagged and rate-limited.
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

// Exchange rate mapping (starts with a safe fallback, updated every poll)
let USD_TO_INR_RATE = 84.0;

let ioRef = null;

// ---------------------------------------------------------------------------
// Warm up yahoo-finance2 on startup.
// The library acquires a cookie/crumb from Yahoo Finance on its very first
// call. After a backend restart (e.g. Render resuming from suspension), this
// first request often fails or is slow. We pre-warm it immediately so the
// crumb is ready before any real user request arrives.
// ---------------------------------------------------------------------------
const warmupYahooFinance = async (attempt = 1) => {
  try {
    await yahooFinance.quote("INR=X");
    console.log("✅ Yahoo Finance warmed up successfully.");
  } catch (err) {
    if (attempt <= 8) {
      const delay = Math.min(5000 * attempt, 30000);
      console.warn(
        `⚠️  Yahoo Finance warmup failed (attempt ${attempt}/8), retrying in ${delay / 1000}s — ${err.message}`
      );
      setTimeout(() => warmupYahooFinance(attempt + 1), delay);
    } else {
      console.error(
        "❌ Yahoo Finance warmup failed after 8 attempts. Quotes may be delayed on first load."
      );
    }
  }
};

const initMarketDataService = (io) => {
  ioRef = io;
  // Kick off warmup immediately on startup
  warmupYahooFinance();
  // Poll every 5s — browser headers reduce rate-limit risk on Render
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
// Helper: fetch a batch of symbols using quote() and update cache + FX rate.
// ---------------------------------------------------------------------------
const fetchBatch = async (symbolsToFetch) => {
  // Always include INR=X so we have a live FX rate
  const batch = symbolsToFetch.includes("INR=X")
    ? symbolsToFetch
    : [...symbolsToFetch, "INR=X"];

  const quotes = await yahooFinance.quote(batch);
  const results = Array.isArray(quotes) ? quotes : [quotes];

  // 1. Update FX rate
  const fxQuote = results.find((q) => q.symbol === "INR=X");
  if (fxQuote && fxQuote.regularMarketPrice) {
    USD_TO_INR_RATE = fxQuote.regularMarketPrice;
  }

  // 2. Process each symbol
  const formatted = [];
  results.forEach((q) => {
    if (q.symbol === "INR=X") return;
    if (!q.regularMarketPrice) return;

    let finalPrice = q.regularMarketPrice;
    if (q.currency === "USD") {
      finalPrice = finalPrice * USD_TO_INR_RATE;
    }

    const entry = {
      name: q.symbol,
      price: finalPrice,
      nativePrice: q.regularMarketPrice,
      currency: q.currency || "INR",
      percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
      isDown: (q.regularMarketChangePercent || 0) < 0,
    };

    cache.set(q.symbol, entry);
    formatted.push(entry);
  });

  return formatted;
};

// ---------------------------------------------------------------------------
// Polling loop — broadcast live prices to subscribed WebSocket clients
// ---------------------------------------------------------------------------
const fetchAndBroadcast = async () => {
  if (symbolCounts.size === 0) return;

  const symbolsToFetch = Array.from(symbolCounts.keys());

  try {
    const results = await fetchBatch(symbolsToFetch);
    results.forEach((entry) => {
      if (ioRef) {
        ioRef.to(`stock:${entry.name}`).emit("price_update", entry);
      }
    });
  } catch (err) {
    // On failure (e.g. 429) the cache retains the last known state.
    console.error("Market Data Fetch Error (cache retained):", err.message);
  }
};

// ---------------------------------------------------------------------------
// Initial quote fetch — called when a client connects and needs current prices
// ---------------------------------------------------------------------------
const getInitialQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];

  // Only fetch symbols not already cached
  const missing = symbols.filter((s) => !cache.has(s));

  if (missing.length > 0) {
    try {
      await fetchBatch(missing);
    } catch (err) {
      console.error("Error fetching initial quotes:", err.message);
    }
  }

  return symbols.map((s) => cache.get(s)).filter(Boolean);
};

module.exports = {
  initMarketDataService,
  addSymbols,
  removeSymbols,
  getInitialQuotes,
  cache,
};
