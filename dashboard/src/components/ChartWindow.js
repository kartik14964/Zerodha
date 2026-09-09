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
    if (s.endsWith("-USD")) return `CRYPTO:${s.replace("-USD","USD")}`;
    if (s.endsWith(".NS")) return `NSE:${s.slice(0,-3)}`;
    if (s.endsWith(".BO")) return `BSE:${s.slice(0,-3)}`;
    if (s.endsWith(".L"))  return `LSE:${s.slice(0,-2)}`;
    if (s.endsWith(".DE")) return `XETR:${s.slice(0,-3)}`;
    if (s.endsWith(".SW")) return `SIX:${s.slice(0,-3)}`;
    if (s.endsWith(".T"))  return `TSE:${s.slice(0,-2)}`;
    return s;
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
