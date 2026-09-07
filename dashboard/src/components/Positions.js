import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Skeleton } from "@mui/material";

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

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
  }, []);

  useEffect(() => {
    if (allPositions.length === 0) return;
    
    const getYahooSymbol = (name) => {
      if (!name.includes(".") && !name.includes("-") && !name.startsWith("^")) {
        return name + ".NS";
      }
      return name;
    };

    const symbols = allPositions.map((p) => getYahooSymbol(p.name)).join(",");

    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbols}`);
        const priceMap = {};
        data.forEach(q => {
          const position = allPositions.find(p => getYahooSymbol(p.name) === q.name);
          if (position) {
            priceMap[position.name] = {
              price: q.price,
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
      const symbolArray = allPositions.map((p) => getYahooSymbol(p.name));
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (q) => {
        setLivePrices((prev) => {
          const position = allPositions.find(p => getYahooSymbol(p.name) === q.name);
          if (position) {
            return {
              ...prev,
              [position.name]: {
                price: q.price,
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
              
              return (
                <tr key={index}>
                  <td>{stock.product || "CNC"}</td>
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{formatINR(avg)}</td>

                  <td className={profClass}>{formatINR(ltp)}</td>

                  <td className={profClass}>{formatINR(profitLoss)}</td>

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
