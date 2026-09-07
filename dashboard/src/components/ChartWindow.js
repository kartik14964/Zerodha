import React, { useContext } from "react";
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import GeneralContext from "./GeneralContext";
import "./ChartWindow.css"; 

const ChartWindow = ({ stock }) => {
  const { closeWindow } = useContext(GeneralContext);

  // Format symbol for TradingView (Yahoo Finance -> TradingView)
  const getTradingViewSymbol = (name) => {
    let cleanName = (name || "").toUpperCase();
    
    // Indices
    if (cleanName === "^NSEI") return "NSE:NIFTY";
    if (cleanName === "^BSESN") return "BSE:SENSEX";
    if (cleanName === "^NSEBANK") return "NSE:BANKNIFTY";

    // Crypto (e.g. BTC-USD -> CRYPTO:BTCUSD)
    if (cleanName.endsWith("-USD")) {
      return `CRYPTO:${cleanName.replace("-USD", "USD")}`;
    }

    // Indian Stocks with Yahoo suffixes
    if (cleanName.endsWith(".NS")) {
      return `BSE:${cleanName.replace(".NS", "")}`;
    }
    if (cleanName.endsWith(".BO")) {
      return `BSE:${cleanName.replace(".BO", "")}`;
    }

    // German Stocks (.DE -> XETRA)
    if (cleanName.endsWith(".DE")) {
      return `XETR:${cleanName.replace(".DE", "")}`;
    }
    
    // London Stocks (.L -> LSE)
    if (cleanName.endsWith(".L")) {
      return `LSE:${cleanName.replace(".L", "")}`;
    }

    // Legacy data.js hardcoded Indian stocks without suffix
    const legacyIndianStocks = ["INFY", "ONGC", "TCS", "ITC", "RELIANCE", "WIPRO", "HDFCBANK", "SBIN", "BHARTIARTL"];
    if (legacyIndianStocks.includes(cleanName)) {
      return `BSE:${cleanName}`;
    }

    // Default for US stocks like AAPL, MSFT, etc. TradingView resolves them automatically
    return cleanName;
  };

  const symbol = getTradingViewSymbol(stock.symbol || stock.name);

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
