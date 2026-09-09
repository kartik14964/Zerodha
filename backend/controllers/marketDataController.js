const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const { normalizeYahooExchange, buildTradingViewSymbol } = require("../config/yahooExchanges");

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

    const result = await yahooFinance.search(query);

    // Include all asset types — equities, ETFs, crypto, indices from ANY market
    const formatted = [];
    const seenSymbols = new Set();

    for (const q of result.quotes) {
      if (!["EQUITY", "ETF", "CRYPTOCURRENCY", "INDEX"].includes(q.quoteType)) continue;
      if (seenSymbols.has(q.symbol)) continue;
      seenSymbols.add(q.symbol);

      const exchangeMapping = normalizeYahooExchange(q.exchange);

      formatted.push({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: exchangeMapping ? exchangeMapping.exchange : (q.exchange || ""),
        market: exchangeMapping ? exchangeMapping.market.name : "",
        currency: q.currency || (exchangeMapping ? exchangeMapping.market.currency : ""),
        assetType: q.quoteType,
        tradingViewSymbol: buildTradingViewSymbol(q.symbol, q.exchange),
      });

      if (formatted.length >= 10) break;
    }

    res.json(formatted);
  } catch (err) {
    console.error("Error searching quotes:", err);
    res.status(500).json({ error: "Failed to search" });
  }
};

const getMarketStatus = async (req, res) => {
  try {
    // Use Yahoo's own marketState field — handles holidays, DST, and lunch breaks automatically.
    // Fetch one representative symbol per exchange.
    const symbols = [
      "^NSEI",    // NSE (India)
      "^BSESN",   // BSE (India)
      "AAPL",     // NASDAQ (USA)
      "JPM",      // NYSE (USA)
      "7203.T",   // TSE (Japan)
      "SHEL.L",   // LSE (UK)
    ];

    const quotes = await yahooFinance.quote(symbols);
    const results = Array.isArray(quotes) ? quotes : [quotes];

    // Map symbol → exchange name, then extract Yahoo's marketState
    const exchangeSymbols = {
      "^NSEI": "NSE",
      "^BSESN": "BSE",
      "AAPL": "NASDAQ",
      "JPM": "NYSE",
      "7203.T": "TSE",
      "SHEL.L": "LSE",
    };

    const statusMap = {};
    results.forEach(q => {
      const exchange = exchangeSymbols[q.symbol];
      if (exchange && q.marketState) {
        // Yahoo returns: REGULAR (open), PRE, POST, CLOSED, PREPRE, POSTPOST
        const isOpen = q.marketState === "REGULAR";
        const isPrePost = ["PRE", "POST"].includes(q.marketState);
        statusMap[exchange] = {
          status: isOpen ? "OPEN" : isPrePost ? q.marketState : "CLOSED",
          rawState: q.marketState,
        };
      }
    });

    res.json({ exchanges: statusMap, timestamp: new Date().toISOString() });
  } catch (err) {
    console.error("Error fetching market status:", err);
    res.status(500).json({ state: "UNKNOWN" });
  }
};

module.exports = { getQuotes, searchQuotes, getMarketStatus };
