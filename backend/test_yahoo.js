const yahooFinance = require("yahoo-finance2").default;
async function test() {
  const quote = await yahooFinance.quote("BTC-USD");
  console.log("Currency:", quote.currency);
}
test();
