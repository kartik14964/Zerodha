import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Funds = () => {
  // Track the actual balance and used margin from the server
  const [balance, setBalance] = useState(0);
  const [usedMargin, setUsedMargin] = useState(0);

  useEffect(() => {
    // Fetch the actual user balance from the session
    const fetchFunds = async () => {
      try {
        const userRes = await axios.get("https://zerodha-mdj3.onrender.com/me", { withCredentials: true });
        if (userRes.data.loggedIn) {
          setBalance(userRes.data.user.balance);
        }

        //  Fetch holdings to calculate "Used Margin"
        const holdingsRes = await axios.get("https://zerodha-mdj3.onrender.com/allHoldings", { withCredentials: true });
        
        // Sum up total investment value
        let totalInvestment = 0;
        holdingsRes.data.forEach((stock) => {
          totalInvestment += (stock.avg * stock.qty);
        });
        setUsedMargin(totalInvestment);

      } catch (err) {
        console.error("Error fetching funds data", err);
      }
    };

    fetchFunds();
  }, []);

  return (
    <>
      <div className="funds">
        <p>Instant, zero-cost fund transfers with UPI </p>
        <Link className="btn btn-green">Add funds</Link>
        <Link className="btn btn-blue">Withdraw</Link>
      </div>

      <div className="row">
        <div className="col">
          <span><p>Equity</p></span>

          <div className="table">
            <div className="data">
              <p>Available margin</p>
              <p className="imp colored">{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="data">
              <p>Used margin</p>
              <p className="imp">{usedMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="data">
              <p>Available cash</p>
              <p className="imp">{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>{(balance + usedMargin).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            </div>
            
            <div className="data"><p>Payin</p><p>0.00</p></div>
            <div className="data"><p>SPAN</p><p>0.00</p></div>
            <div className="data"><p>Delivery margin</p><p>0.00</p></div>
            <div className="data"><p>Exposure</p><p>0.00</p></div>
            <div className="data"><p>Options premium</p><p>0.00</p></div>
            <hr />
            <div className="data"><p>Collateral (Liquid funds)</p><p>0.00</p></div>
            <div className="data"><p>Collateral (Equity)</p><p>0.00</p></div>
            <div className="data"><p>Total Collateral</p><p>0.00</p></div>
          </div>
        </div>

        <div className="col">
          <div className="commodity">
            <p>You don't have a commodity account</p>
            <Link className="btn btn-blue">Open Account</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Funds;