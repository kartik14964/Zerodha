import React, { useState, useEffect } from "react";
import axios from "axios";
import { watchlist } from "../data/data";

const Summary = () => {
  const [holdings, setHoldings] = useState([]);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/allHoldings`)
      .then((res) => setHoldings(res.data))
      .catch((err) => console.log(err));

    const token = localStorage.getItem("token");
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserEmail(res.data.user.email))
      .catch((err) => console.log(err));
  }, []);
  const rawName = userEmail ? userEmail.split("@")[0] : "User";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

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
        <h6>Hi, {displayName}!</h6>
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
