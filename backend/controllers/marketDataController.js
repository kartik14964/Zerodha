const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const { getInitialQuotes } = require("../services/marketDataService");

const getQuotes = async (req, res) => {
  try {
    const symbols = req.query.symbols;
    if (!symbols) return res.status(400).json({ error: "Missing symbols query parameter" });
    const symbolArray = symbols.split(",");

    // Fetch multi-currency aware quotes from the central service
    const formatted = await getInitialQuotes(symbolArray);

    res.json(formatted);
  } catch (err) {
    console.error("Error fetching quotes:", err);
    res.status(500).json({ error: "Failed to fetch quotes" });
  }
};

const searchQuotes = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: "Missing query parameter" });

    // Search Yahoo Finance
    const result = await yahooFinance.search(query);

    // Filter out irrelevant results, keep equities, ETFs, crypto, and indices
    const formatted = result.quotes
      .filter(q => ["EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX"].includes(q.quoteType))
      .slice(0, 5) // Return top 5 results
      .map(q => ({
        name: q.symbol,
        longName: q.longname || q.shortname || q.symbol,
        exchange: q.exchange
      }));

    res.json(formatted);
  } catch (err) {
    console.error("Error searching quotes:", err);
    res.status(500).json({ error: "Failed to search" });
  }
};

const getMarketStatus = async (req, res) => {
  try {
    // Query NIFTY 50 as the representative index for Indian Market
    const quote = await yahooFinance.quote("^NSEI");
    res.json({
      state: quote.marketState || "CLOSED", // "REGULAR", "PRE", "POST", "CLOSED"
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error fetching market status:", err);
    res.status(500).json({ state: "UNKNOWN" });
  }
};

module.exports = { getQuotes, searchQuotes, getMarketStatus };
