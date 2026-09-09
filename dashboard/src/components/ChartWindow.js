import React, { useContext } from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import GeneralContext from "./GeneralContext";
import "./ChartWindow.css";

const ChartWindow = ({ stock }) => {
  const { closeWindow } = useContext(GeneralContext);

  // tradingViewSymbol is pre-computed on the backend from Yahoo's raw exchange code.
  // Fallback: derive from symbol suffix for old DB records that predate this field.
  const getTvSymbolFallback = (sym) => {
    const s = (sym || "").toUpperCase();
    if (s === "^NSEI")    return "NSE:NIFTY";
    if (s === "^BSESN")   return "BSE:SENSEX";
    if (s === "^NSEBANK") return "NSE:BANKNIFTY";
    if (s.endsWith("-USD")) return `CRYPTO:${s.replace("-USD", "USD")}`;

    // Full suffix → TradingView prefix table (mirrors backend yahooExchanges.js)
    const suffixMap = [
      [".NS",  "NSE"],      [".BO",  "BSE"],
      [".L",   "LSE"],      [".T",   "TSE"],
      [".HK",  "HKEX"],    [".DE",  "XETR"],
      [".SW",  "SIX"],     [".PA",  "EURONEXT"],
      [".AS",  "EURONEXT"],[".MI",  "MIL"],
      [".MC",  "BME"],     [".AX",  "ASX"],
      [".F",   "FRA"],     [".TO",  "TSX"],
      [".V",   "TSXV"],    [".CN",  "CSE"],
      [".NE",  "NEO"],     [".SS",  "SSE"],
      [".SZ",  "SZSE"],    [".KS",  "KRX"],
      [".KQ",  "KOSDAQ"],  [".SA",  "BOVESPA"],
      [".SI",  "SGX"],     [".TW",  "TWSE"],
      [".TWO", "TPEX"],    [".JK",  "IDX"],
      [".MX",  "BMV"],     [".SR",  "TADAWUL"],
      [".BK",  "SET"],     [".JO",  "JSE"],
    ];
    for (const [suffix, prefix] of suffixMap) {
      if (s.endsWith(suffix)) {
        const base = s.slice(0, -suffix.length);
        // HK: Yahoo pads to 4 digits (0700) but TradingView uses unpadded (700)
        const cleanBase = prefix === "HKEX" ? base.replace(/^0+/, "") : base;
        return `${prefix}:${cleanBase}`;
      }
    }
    // Generic: strip any remaining dot-suffix, return bare ticker (US stocks)
    return s.replace(/\.[A-Z]{1,4}$/, "");
  };

  const symbol = stock.tradingViewSymbol || getTvSymbolFallback(stock.symbol || stock.name);

  return (
    <div className="chart-container" id="chart-window">
      <div className="chart-header">
        <h3>{stock.name} Advanced Chart</h3>
        <button className="close-btn" onClick={closeWindow}>✖</button>
      </div>
      <div className="chart-body">
        <AdvancedRealTimeChart
          theme="light"
          autosize
          symbol={symbol}
          timezone="Asia/Kolkata"
          interval="D"
          hide_side_toolbar={false}
        />
      </div>
    </div>
  );
};

export default ChartWindow;
