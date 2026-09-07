const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const getQuotes = async (req, res) => {
  try {
    const symbols = req.query.symbols;
    if (!symbols) return res.status(400).json({ error: "Missing symbols query parameter" });
    const symbolArray = symbols.split(",");
    
    const quotes = await yahooFinance.quote(symbolArray);
    const results = Array.isArray(quotes) ? quotes : [quotes];
    
    const formatted = results.map(q => ({
      name: q.symbol,
      price: q.regularMarketPrice,
      percent: (q.regularMarketChangePercent || 0).toFixed(2) + "%",
      isDown: (q.regularMarketChangePercent || 0) < 0
    }));
    
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

module.exports = { getQuotes, searchQuotes };
