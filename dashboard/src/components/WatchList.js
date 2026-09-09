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
    const cleanName = stockData.name.replace(".NS", "").replace(".BO", "");
    if (!liveWatchlist.find((s) => s.name === cleanName)) {
      try {
        const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/watchlist`, {
          name: cleanName,
          symbol: stockData.name
        });
        
        setLiveWatchlist((prev) => [
          {
            _id: data._id,
            name: cleanName,
            symbol: stockData.name,
            price: 0,
            nativePrice: 0,
            currency: 'INR',
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
          price: 0,
          nativePrice: 0,
          currency: 'INR',
          percent: "0.00%",
          isDown: false,
        }));
        
        if (savedList.length === 0) {
          const defaultStocks = [
            { name: "RELIANCE", symbol: "RELIANCE.NS", price: 0, percent: "0.00%", isDown: false },
            { name: "TCS", symbol: "TCS.NS", price: 0, percent: "0.00%", isDown: false },
            { name: "HDFCBANK", symbol: "HDFCBANK.NS", price: 0, percent: "0.00%", isDown: false },
            { name: "INFY", symbol: "INFY.NS", price: 0, percent: "0.00%", isDown: false },
            { name: "SBI", symbol: "SBIN.NS", price: 0, percent: "0.00%", isDown: false },
            { name: "BTC-USD", symbol: "BTC-USD", price: 0, percent: "0.00%", isDown: false },
            { name: "ETH-USD", symbol: "ETH-USD", price: 0, percent: "0.00%", isDown: false },
            { name: "AAPL", symbol: "AAPL", price: 0, percent: "0.00%", isDown: false },
            { name: "TSLA", symbol: "TSLA", price: 0, percent: "0.00%", isDown: false },
            { name: "NIFTY 50", symbol: "^NSEI", price: 0, percent: "0.00%", isDown: false }
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

    // 1. Initial Data Fetch
    const fetchQuotes = async () => {
      try {
        const { data: liveDataArray } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbolsJoined}`
        );

        setLiveWatchlist((prevWatchlist) =>
          prevWatchlist.map((stock) => {
            const liveStock = liveDataArray.find(
              (q) => q.name === (stock.symbol || stock.name + ".NS")
            );
            if (liveStock) {
              return {
                ...stock,
                price: liveStock.price,
                nativePrice: liveStock.nativePrice || liveStock.price,
                currency: liveStock.currency || 'INR',
                percent: liveStock.percent,
                isDown: liveStock.isDown,
              };
            }
            return stock;
          })
        );
      } catch (err) {
        console.error("Failed to fetch live quotes", err);
      }
    };

    fetchQuotes();

    // 2. WebSocket Subscription
    if (socket) {
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (data) => {
        setLiveWatchlist((prevWatchlist) =>
          prevWatchlist.map((stock) => {
            if ((stock.symbol || stock.name + ".NS") === data.name) {
              return {
                ...stock,
                price: data.price,
                nativePrice: data.nativePrice || data.price,
                currency: data.currency || 'INR',
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
        socket.off("price_update", handlePriceUpdate);
        socket.emit("unsubscribe", symbolArray);
      };
    }
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
                  <span style={{ fontWeight: 500, color: "#333", display: "block" }}>{result.name}</span>
                  <span style={{ fontSize: "11px", color: "#888" }}>{result.longName}</span>
                </div>
                <button style={{
                  background: "#4a90e2", color: "white", border: "none", 
                  borderRadius: "3px", padding: "4px 8px", cursor: "pointer"
                }}>+</button>
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
        <p className={stock.isDown ? "down" : "up"}>{stock.name}</p>

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

const WatchlistActions = ({stock, removeStockFromWatchlist}) => {
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
