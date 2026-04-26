import React, { useState, useEffect } from "react";
import axios from "axios";
import { watchlist } from "../data/data";

const Summary = () => {
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    axios
      .get("https://zerodha-mdj3.onrender.com/allHoldings", { withCredentials: true })
      .then((res) => setHoldings(res.data))
      .catch((err) => console.log(err));
  }, []);

  let totalInvestment = 0;
  let totalCurrentValue = 0;

  // Loop through database stocks one by one
  holdings.forEach((stock) => {
    // Find the live price from data.js
    const marketStock = watchlist.find((s) => s.name === stock.name);
    const livePrice = marketStock ? marketStock.price : stock.price;

    // Add to our totals
    totalInvestment = totalInvestment + stock.avg * stock.qty;
    totalCurrentValue = totalCurrentValue + livePrice * stock.qty;
  });

  // Calculate final numbers
  const totalPnL = totalCurrentValue - totalInvestment;
  const isProfit = totalPnL >= 0;

  // Wallet numbers
  const openingBalance = 100000;
  const marginAvailable = openingBalance - totalInvestment;

  return (
    <>
      <div className="username">
        <h6>Hi, User!</h6>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Equity</p>
        </span>
        <div className="data">
          <div className="first">
            <h3>{(marginAvailable / 1000).toFixed(2)}k</h3>
            <p>Margin available</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Margins used <span>{(totalInvestment / 1000).toFixed(2)}k</span>
            </p>
            <p>
              Opening balance <span>{(openingBalance / 1000).toFixed(2)}k</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section">
        <span>
          <p>Holdings ({holdings.length})</p>
        </span>
        <div className="data">
          <div className="first">
            <h3 className={isProfit ? "profit" : "loss"}>
              {(Math.abs(totalPnL) / 1000).toFixed(2)}k
            </h3>
            <p>P&L</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Current Value{" "}
              <span>{(totalCurrentValue / 1000).toFixed(2)}k</span>
            </p>
            <p>
              Investment <span>{(totalInvestment / 1000).toFixed(2)}k</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>
    </>
  );
};

export default Summary;
