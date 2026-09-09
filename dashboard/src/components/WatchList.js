import React, { useState, useEffect, useContext } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Tooltip, Grow } from "@mui/material";
import {
  BarChartOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  MoreHoriz,
  DeleteOutlined,
} from "@mui/icons-material";
import GeneralContext from "./GeneralContext";


const formatCurrency = (value, currencyCode = 'INR') => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const WatchList = () => {
  const [liveWatchlist, setLiveWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeStockId, setActiveStockId] = useState(null);
  const socket = useSocket();

  const handleSearch = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const { data } = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/search?q=${val}`
      );
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const removeStockFromWatchlist = async (id) => {
    try {
      await axios.delete(`${process.env.REACT_APP_BACKEND_URL}/watchlist/${id}`);
      setLiveWatchlist((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const addStockToWatchlist = async (stockData) => {
    // stockData is now a canonical normalized asset from the search API
    const symbol = stockData.symbol;
    const name = stockData.name || symbol;
    if (!liveWatchlist.find((s) => s.symbol === symbol)) {
      try {
        const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/watchlist`, {
          name: name,
          symbol: symbol
        });

        setLiveWatchlist((prev) => [
          {
            _id: data._id,
            name: name,
            symbol: symbol,
            market: stockData.market || "",
            exchange: stockData.exchange || "",
            marketStatus: "UNKNOWN",
            price: 0,
            nativePrice: 0,
            currency: stockData.currency || 'INR',
            percent: "0.00%",
            isDown: false,
          },
          ...prev,
        ]);
      } catch (err) {
        console.error("Failed to add to watchlist in DB", err);
      }
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/watchlist`)
      .then(res => {
        const savedList = res.data.map(item => ({
          _id: item._id,
          name: item.name,
          symbol: item.symbol,
          market: "",
          exchange: "",
          marketStatus: "UNKNOWN",
          price: 0,
          nativePrice: 0,
          currency: 'INR',
          percent: "0.00%",
          isDown: false,
        }));

        if (savedList.length === 0) {
          const defaultStocks = [
            { name: "RELIANCE", symbol: "RELIANCE.NS", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "TCS", symbol: "TCS.NS", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "HDFCBANK", symbol: "HDFCBANK.NS", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "INFY", symbol: "INFY.NS", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "SBI", symbol: "SBIN.NS", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "AAPL", symbol: "AAPL", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "TSLA", symbol: "TSLA", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" },
            { name: "NIFTY 50", symbol: "^NSEI", price: 0, percent: "0.00%", isDown: false, market: "", exchange: "", marketStatus: "UNKNOWN" }
          ];
          setLiveWatchlist(defaultStocks);
        } else {
          setLiveWatchlist(savedList);
        }
      })
      .catch(err => console.error(err));
  }, []);

  const watchListSymbols = liveWatchlist.map((s) => s.symbol || s.name + ".NS").join(",");

  useEffect(() => {
    if (liveWatchlist.length === 0) return;
    const symbolArray = watchListSymbols.split(",");
    const symbolsJoined = watchListSymbols;

    // Retry fetch with exponential backoff.
    // When the backend resumes after suspension, the Yahoo Finance warmup
    // takes 10-40s. Without retry, a [] response leaves the list at 0 forever.
    let retryTimer = null;
    const fetchQuotes = async (attempt = 1) => {
      try {
        const { data: liveDataArray } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbolsJoined}`
        );

        if (liveDataArray && liveDataArray.length > 0) {
          setLiveWatchlist((prevWatchlist) =>
            prevWatchlist.map((stock) => {
              const liveStock = liveDataArray.find(
                (q) => q.symbol === (stock.symbol || stock.name + ".NS") ||
                        q.name === (stock.symbol || stock.name + ".NS")
              );
              if (liveStock) {
                return {
                  ...stock,
                  price: liveStock.price,
                  nativePrice: liveStock.nativePrice || liveStock.price,
                  currency: liveStock.currency || 'INR',
                  market: liveStock.market || stock.market || "",
                  exchange: liveStock.exchange || stock.exchange || "",
                  marketStatus: liveStock.marketStatus || "UNKNOWN",
                  percent: liveStock.percent,
                  isDown: liveStock.isDown,
                };
              }
              return stock;
            })
          );
        } else if (attempt <= 6) {
          // Backend returned [] — warmup not done yet, retry
          const delay = Math.min(4000 * attempt, 20000);
          retryTimer = setTimeout(() => fetchQuotes(attempt + 1), delay);
        }
      } catch (err) {
        if (attempt <= 6) {
          // Backend still waking up — retry with backoff
          const delay = Math.min(4000 * attempt, 20000);
          retryTimer = setTimeout(() => fetchQuotes(attempt + 1), delay);
        } else {
          console.error("Failed to fetch live quotes after retries.", err);
        }
      }
    };

    fetchQuotes();

    // 2. WebSocket Subscription
    if (socket) {
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (data) => {
        setLiveWatchlist((prevWatchlist) =>
          prevWatchlist.map((stock) => {
            if ((stock.symbol || stock.name + ".NS") === (data.symbol || data.name)) {
              return {
                ...stock,
                price: data.price,
                nativePrice: data.nativePrice || data.price,
                currency: data.currency || 'INR',
                market: data.market || stock.market || "",
                exchange: data.exchange || stock.exchange || "",
                marketStatus: data.marketStatus || stock.marketStatus || "UNKNOWN",
                percent: data.percent,
                isDown: data.isDown,
              };
            }
            return stock;
          })
        );
      };

      socket.on("price_update", handlePriceUpdate);

      return () => {
        if (retryTimer) clearTimeout(retryTimer);
        socket.off("price_update", handlePriceUpdate);
        socket.emit("unsubscribe", symbolArray);
      };
    }

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchListSymbols, socket]);


  return (
    <div className="watchlist-container">
      <div className="search-container" style={{ position: "relative" }}>
        <input
          type="text"
          name="search"
          id="search"
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search eg:infy, bse, nifty fut weekly, gold mcx"
          className="search"
        />
        <span className="counts"> {liveWatchlist.length}</span>

        {searchResults.length > 0 && (
          <ul className="search-results" style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            background: "#fff", zIndex: 10, listStyle: "none",
            padding: 0, margin: 0, border: "1px solid #ddd",
            borderRadius: "4px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}>
            {searchResults.map((result, i) => (
              <li
                key={i}
                onClick={() => addStockToWatchlist(result)}
                style={{
                  padding: "10px 15px", borderBottom: "1px solid #eee",
                  cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "#333", display: "block", fontSize: "13px" }}>
                    {result.name}
                  </span>
                  <span style={{ fontSize: "11px", color: "#888" }}>
                    {result.symbol} · {result.exchange} · {result.market}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "#2196F3", fontWeight: 500 }}>
                    {result.currency}
                  </span>
                  <button style={{
                    background: "#4a90e2", color: "white", border: "none",
                    borderRadius: "3px", padding: "4px 8px", cursor: "pointer",
                    marginLeft: "8px"
                  }}>+</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ul className="list">
        {liveWatchlist.map((stock, index) => {
          const stockId = stock._id || index;
          return (
            <WatchListItem
              stock={stock}
              key={stockId}
              isActive={activeStockId === stockId}
              onToggle={() => setActiveStockId(activeStockId === stockId ? null : stockId)}
              removeStockFromWatchlist={removeStockFromWatchlist}
            />
          );
        })}
      </ul>
    </div>
  );
};

export default WatchList;

const WatchListItem = ({ stock, removeStockFromWatchlist, isActive, onToggle }) => {
  const [flashClass, setFlashClass] = useState("");
  const prevPriceRef = React.useRef(stock.price);

  React.useEffect(() => {
    if (prevPriceRef.current !== undefined && prevPriceRef.current !== 0 && prevPriceRef.current !== stock.nativePrice) {
      if (stock.nativePrice > prevPriceRef.current) {
        setFlashClass("flash-up");
      } else if (stock.nativePrice < prevPriceRef.current) {
        setFlashClass("flash-down");
      }
    }
    prevPriceRef.current = stock.nativePrice;

    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [stock.nativePrice]);

  return (
    <li
      className={`${flashClass} ${isActive ? "show-actions active" : ""}`}
      onClick={onToggle}
    >
      <div className="item">
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <p className={stock.isDown ? "down" : "up"} style={{ margin: 0 }}>{stock.name}</p>
          {stock.exchange && (
            <span style={{ fontSize: "10px", color: "#999", display: "flex", alignItems: "center", gap: "4px" }}>
              {stock.exchange}
              {stock.marketStatus === "OPEN" ? (
                <span style={{ color: "#4CAF50", fontWeight: 600 }}>● Open</span>
              ) : stock.marketStatus === "PRE" ? (
                <span style={{ color: "#FF9800", fontWeight: 600 }}>● Pre</span>
              ) : stock.marketStatus === "POST" ? (
                <span style={{ color: "#FF9800", fontWeight: 600 }}>● Post</span>
              ) : stock.marketStatus === "CLOSED" ? (
                <span style={{ color: "#f44336", fontWeight: 600 }}>● Closed</span>
              ) : null}
            </span>
          )}
        </div>

        <div className="item-info">
          <span className="percent">{stock.percent}</span>
          {stock.isDown ? (
            <KeyboardArrowDown className="down" />
          ) : (
            <KeyboardArrowUp className="up" />
          )}
          <span className={`price ${stock.isDown ? "down" : "up"}`}>
            {stock.price === 0
              ? "..."
              : formatCurrency(stock.nativePrice || stock.price, stock.currency || 'INR')}
          </span>
        </div>
      </div>
      <WatchlistActions stock={stock} removeStockFromWatchlist={removeStockFromWatchlist} />
    </li>
  );
};

const WatchlistActions = ({ stock, removeStockFromWatchlist }) => {
  const { openBuyWindow, openSellWindow, openChartWindow } = useContext(GeneralContext);

  return (
    <span className="actions">
      <span>
        <Tooltip
          title="Buy (B)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="buy" onClick={(e) => { e.stopPropagation(); openBuyWindow(stock); }}>
            Buy
          </button>
        </Tooltip>
        <Tooltip
          title="Sell (S)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="sell" onClick={(e) => { e.stopPropagation(); openSellWindow(stock); }}>
            Sell
          </button>
        </Tooltip>
        <Tooltip
          title="Analytics (A)"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="action" onClick={(e) => { e.stopPropagation(); openChartWindow(stock); }}>
            <BarChartOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip
          title="Remove from Watchlist"
          placement="top"
          arrow
          TransitionComponent={Grow}
        >
          <button className="action" onClick={(e) => { e.stopPropagation(); removeStockFromWatchlist(stock._id); }}>
            <DeleteOutlined className="icon" />
          </button>
        </Tooltip>
        <Tooltip title="More" placement="top" arrow TransitionComponent={Grow}>
          <button className="action">
            <MoreHoriz className="icon" />
          </button>
        </Tooltip>
      </span>
    </span>
  );
};
