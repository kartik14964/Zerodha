import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import GeneralContext from "./GeneralContext";
import { useContext } from "react";
import axios from "axios";
import { Skeleton } from "@mui/material";

import { formatCurrency } from "../utils/currencyFormatter";

const formatINR = (value) => formatCurrency(value, "INR");

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { refreshFlag } = useContext(GeneralContext);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/allPositions`)
      .then((res) => {
        setAllPositions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshFlag]);

  useEffect(() => {
    if (allPositions.length === 0) return;
    
    const getYahooSymbol = (p) => p.symbol || p.name;

    const symbols = allPositions.map(getYahooSymbol).join(",");

    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbols}`);
        const priceMap = {};
        data.forEach(q => {
          const position = allPositions.find(p => getYahooSymbol(p) === q.name || p.name === q.name);
          if (position) {
            priceMap[position.name] = {
              price: q.price,
              nativePrice: q.nativePrice,
              currency: q.currency,
              percent: q.percent,
              isDown: q.isDown
            };
          }
        });
        setLivePrices(priceMap);
      } catch (err) {}
    };

    fetchPrices();

    if (socket) {
      const symbolArray = allPositions.map(getYahooSymbol);
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (q) => {
        setLivePrices((prev) => {
          const position = allPositions.find(p => getYahooSymbol(p) === q.name || p.name === q.name);
          if (position) {
            return {
              ...prev,
              [position.name]: {
                price: q.price,
                nativePrice: q.nativePrice,
                currency: q.currency,
                percent: q.percent,
                isDown: q.isDown
              }
            };
          }
          return prev;
        });
      };

      socket.on("price_update", handlePriceUpdate);

      return () => {
        socket.off("price_update", handlePriceUpdate);
        socket.emit("unsubscribe", symbolArray);
      };
    }
  }, [allPositions, socket]);
  return (
    <>
      <h3 className="title">Positions ({allPositions.length})</h3>

      <div className="order-table">
        <table>
          <tr>
            <th>Product</th>
            <th>Instrument</th>
            <th>Qty.</th>
            <th>Avg.</th>
            <th>LTP</th>
            <th>P&L</th>
            <th>Chg.</th>
          </tr>

          {loading ? (
            [1, 2].map((n) => (
              <tr key={n}>
                <td><Skeleton variant="text" width={40} /></td>
                <td><Skeleton variant="text" width={80} /></td>
                <td><Skeleton variant="text" width={30} /></td>
                <td><Skeleton variant="text" width={60} /></td>
                <td><Skeleton variant="text" width={60} /></td>
                <td><Skeleton variant="text" width={80} /></td>
                <td><Skeleton variant="text" width={40} /></td>
              </tr>
            ))
          ) : allPositions.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                <p style={{ color: "#666" }}>You don't have any open positions.</p>
              </td>
            </tr>
          ) : (
            allPositions.map((stock, index) => {
              const liveData = livePrices[stock.name];
              const ltp = liveData ? Number(liveData.price) : Number(stock.price || 0);
              
              const avg = Number(stock?.avg || 0);
              const qty = Number(stock?.qty || 0);

              const curValue = ltp * qty;
              const investmentValue = avg * qty;
              const profitLoss = curValue - investmentValue;

              const pnlPercent = avg > 0 ? ((ltp - avg) / avg) * 100 : 0;

              const profClass = profitLoss >= 0 ? "profit" : "loss";
              const nativePrice = liveData?.nativePrice;
              const currency = liveData?.currency || "INR";
              
              return (
                <tr key={index}>
                  <td>{stock.product || "CNC"}</td>
                  <td>
                    <div>{stock.name}</div>
                    {stock.exchange && <small style={{color: '#888'}}>{stock.exchange} · {stock.currency}</small>}
                  </td>
                  <td>{stock.qty}</td>
                  <td>{formatCurrency(avg, currency)}</td>

                  <td className={profClass}>
                    {formatCurrency(ltp, currency)}
                  </td>

                  <td className={profClass}>{formatCurrency(profitLoss, currency)}</td>

                  <td className={profClass}>
                    {pnlPercent >= 0 ? "+" : ""}
                    {pnlPercent.toFixed(2)}%
                  </td>
                </tr>
              );
            })
          )}
        </table>
      </div>
    </>
  );
};

export default Positions;
