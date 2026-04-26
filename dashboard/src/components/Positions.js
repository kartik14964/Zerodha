import React, { useState, useEffect } from "react";
import { watchlist } from "../data/data";
import axios from "axios";

const Positions = () => {
  const [allPositions, setAllPositions] = useState([]);
  useEffect(() => {
    axios
      .get("https://zerodha-mdj3.onrender.com/allPositions", { withCredentials: true })
      .then((res) => {
        setAllPositions(res.data);
      })
      .catch((err) => console.log(err));
  }, []);
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

          {allPositions.map((stock, index) => {
            const marketStock = watchlist.find(
              (s) =>
                s?.name?.trim()?.toUpperCase() ===
                stock?.name?.trim()?.toUpperCase(),
            );

            const ltp = marketStock?.price
              ? Number(marketStock.price)
              : Number(stock?.price || 0);
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
                <td>{stock.avg.toFixed(2)}</td>

                <td className={profClass}>{ltp.toFixed(2)}</td>

                <td className={profClass}>{profitLoss.toFixed(2)}</td>

                <td className={profClass}>
                  {pnlPercent >= 0 ? "+" : ""}
                  {pnlPercent.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </table>
      </div>
    </>
  );
};

export default Positions;
