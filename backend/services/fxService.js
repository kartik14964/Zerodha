const YahooFinance = require("yahoo-finance2").default;

// Use a configured instance matching marketDataService pattern
const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
  fetchOptions: {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  },
});

// Cache structure: { [currency]: { rate: number, expiresAt: number } }
const rateCache = new Map();
// Prevent overlapping fetches: { [currency]: Promise }
const inFlightRequests = new Map();

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Dynamically gets the conversion rate from the given currency to INR.
 * Uses caching to protect against Yahoo Finance 429 rate limits.
 * @param {string} currency - The 3-letter currency code (e.g. USD, JPY, GBP)
 * @returns {Promise<number>} - The conversion rate to multiply native value by to get INR.
 */
const getRateToINR = async (currency) => {
  if (!currency) return 1;
  const upperCurrency = currency.toUpperCase();
  
  if (upperCurrency === "INR") return 1;

  const now = Date.now();
  const cached = rateCache.get(upperCurrency);

  // Return valid cached rate
  if (cached && cached.expiresAt > now) {
    return cached.rate;
  }

  // If a request for this currency is already in flight, wait for it
  if (inFlightRequests.has(upperCurrency)) {
    return inFlightRequests.get(upperCurrency);
  }

  // Otherwise, fetch the rate from Yahoo Finance
  const fetchPromise = (async () => {
    try {
      // Direct INR pair format on Yahoo is usually XXXINR=X
      const symbol = `${upperCurrency}INR=X`;
      const quote = await yahooFinance.quote(symbol);

      if (quote && quote.regularMarketPrice) {
        const rate = quote.regularMarketPrice;
        rateCache.set(upperCurrency, {
          rate,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return rate;
      }
      
      throw new Error(`Invalid or missing price data for ${symbol}`);
    } catch (err) {
      // If we failed (e.g., 429), check if we have a stale cached rate we can fallback to safely
      if (cached) {
        console.warn(`[fxService] Failed to fetch live rate for ${upperCurrency}. Falling back to stale cache. Error: ${err.message}`);
        return cached.rate;
      }

      // If no direct pair exists or completely failed, try via USD intermediary
      // e.g. XXX -> USD -> INR
      if (upperCurrency !== "USD") {
        try {
          console.log(`[fxService] Trying USD intermediary for ${upperCurrency}...`);
          const xxxUsdQuote = await yahooFinance.quote(`${upperCurrency}USD=X`);
          const usdInrQuote = await yahooFinance.quote(`USDINR=X`);
          
          if (xxxUsdQuote && xxxUsdQuote.regularMarketPrice && usdInrQuote && usdInrQuote.regularMarketPrice) {
            const rate = xxxUsdQuote.regularMarketPrice * usdInrQuote.regularMarketPrice;
            rateCache.set(upperCurrency, {
              rate,
              expiresAt: Date.now() + CACHE_TTL_MS,
            });
            return rate;
          }
        } catch (fallbackErr) {
          console.error(`[fxService] Fallback USD intermediary also failed for ${upperCurrency}.`, fallbackErr.message);
        }
      }

      console.error(`[fxService] Could not resolve FX rate for ${upperCurrency} to INR.`, err.message);
      throw new Error(`Unable to fetch currency conversion rate for ${upperCurrency}`);
    } finally {
      inFlightRequests.delete(upperCurrency);
    }
  })();

  inFlightRequests.set(upperCurrency, fetchPromise);
  return fetchPromise;
};

module.exports = { getRateToINR };
