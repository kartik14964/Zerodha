const MARKETS = {
  INDIA: {
    name: "INDIA",
    exchanges: ["NSE", "BSE"],
    currency: "INR",
    timezone: "Asia/Kolkata",
  },
  USA: {
    name: "USA",
    exchanges: ["NASDAQ", "NYSE"],
    currency: "USD",
    timezone: "America/New_York",
  },
  JAPAN: {
    name: "JAPAN",
    exchanges: ["TSE"],
    currency: "JPY",
    timezone: "Asia/Tokyo",
  },
  UK: {
    name: "UK",
    exchanges: ["LSE"],
    currency: "GBP",
    timezone: "Europe/London",
  },
  EUROPE: {
    name: "EUROPE",
    exchanges: ["XETR", "EURONEXT", "SIX", "MIL", "BME"],
    currency: "EUR",
    timezone: "Europe/Paris",
  },
  CRYPTO: {
    name: "CRYPTO",
    exchanges: ["CCC"],
    currency: "USD",
    timezone: "UTC",
  },
};

module.exports = { MARKETS };
