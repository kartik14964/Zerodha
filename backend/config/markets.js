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
  }
};

module.exports = { MARKETS };
