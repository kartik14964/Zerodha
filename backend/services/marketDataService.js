const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

// Active symbols and their active subscriber count across all clients
const symbolCounts = new Map();
// The last known good price state (In-Memory Cache)
const cache = new Map();

// Exchange rate mapping (Starts with a default fallback, updates every 2 seconds)
let USD_TO_INR_RATE = 83.5;

let ioRef = null;

const initMarketDataService = (io) => {
  ioRef = io;
  // Poll Yahoo Finance every 2 seconds for a closer to "real-time" feel (Note: Risks rate-limiting)
  setInterval(fetchAndBroadcast, 2000);
};

const addSymbols = (symbols) => {
  if (!symbols) return;
  symbols.forEach(symbol => {
    symbolCounts.set(symbol, (symbolCounts.get(symbol) || 0) + 1);
  });
};

const removeSymbols = (symbols) => {
  if (!symbols) return;
  symbols.forEach(symbol => {
    const count = symbolCounts.get(symbol) || 0;
    if (count <= 1) {
      symbolCounts.delete(symbol);
    } else {
      symbolCounts.set(symbol, count - 1);
    }
  });
};

const fetchAndBroadcast = async () => {
  if (symbolCounts.size === 0) return;
  
  const symbolsToFetch = Array.from(symbolCounts.keys());
  
  // Always include the live Forex rate in our batch request
  if (!symbolsToFetch.includes("INR=X")) {
    symbolsToFetch.push("INR=X");
  }
  
  try {
    const quotes = await yahooFinance.quote(symbolsToFetch);
    const results = Array.isArray(quotes) ? quotes : [quotes];
    
    // 1. Extract and update the FX rate first
    const fxQuote = results.find(q => q.symbol === "INR=X");
    if (fxQuote && fxQuote.regularMarketPrice) {
      USD_TO_INR_RATE = fxQuote.regularMarketPrice;
    }
    
    // 2. Process and broadcast the actual stocks
    results.forEach(q => {
      // Don't broadcast the raw FX pair to the frontend watchlist
      if (q.symbol === "INR=X") return; 

      let finalPrice = q.regularMarketPrice || 0;
      if (q.currency === "USD") {
        finalPrice = finalPrice * USD_TO_INR_RATE;
      }

      const formatted = {
        name: q.symbol,
        price: finalPrice, // INR Execution Price
        nativePrice: q.regularMarketPrice || 0, // Native Display Price
        currency: q.currency || "INR",
        percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
        isDown: (q.regularMarketChangePercent || 0) < 0
      };
      
      // Update Cache
      cache.set(q.symbol, formatted);
      
      // Broadcast precisely to clients in this symbol's room
      if (ioRef) {
        ioRef.to(`stock:${q.symbol}`).emit("price_update", formatted);
      }
    });
  } catch (err) {
    console.error("Market Data Fetch Error (Retaining cached state):", err);
    // On failure, cache retains the last known state, and clients just see unchanged prices.
  }
};

const getInitialQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) return [];

  // Identify symbols not yet in cache
  const missing = symbols.filter(s => !cache.has(s));
  
  if (missing.length > 0) {
    if (!missing.includes("INR=X")) missing.push("INR=X");
    
    try {
      const quotes = await yahooFinance.quote(missing);
      const results = Array.isArray(quotes) ? quotes : [quotes];
      
      const fxQuote = results.find(q => q.symbol === "INR=X");
      if (fxQuote && fxQuote.regularMarketPrice) {
        USD_TO_INR_RATE = fxQuote.regularMarketPrice;
      }

      results.forEach(q => {
        if (q.symbol === "INR=X") return;

        let finalPrice = q.regularMarketPrice || 0;
        if (q.currency === "USD") {
           finalPrice = finalPrice * USD_TO_INR_RATE;
        }

        const formatted = {
          name: q.symbol,
          price: finalPrice,
          nativePrice: q.regularMarketPrice || 0,
          currency: q.currency || "INR",
          percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
          isDown: (q.regularMarketChangePercent || 0) < 0
        };
        cache.set(q.symbol, formatted);
      });
    } catch (err) {
       console.error("Error fetching initial quotes:", err);
    }
  }
  
  // Return cached versions for all requested symbols
  return symbols.map(s => cache.get(s)).filter(Boolean);
};

module.exports = { initMarketDataService, addSymbols, removeSymbols, getInitialQuotes };
