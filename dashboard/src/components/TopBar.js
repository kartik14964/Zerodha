import React, { useState, useEffect } from "react";
import axios from "axios";

import Menu from "./Menu";

// We no longer rely on frontend clock math for market status.

const MarketStatus = () => {
  const [status, setStatus] = useState({ isOpen: false, label: "Checking..." });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/market-status`);
        // Yahoo Finance returns "REGULAR" during normal open hours.
        // Other states include "PRE", "POST", "CLOSED".
        const stateMap = {
          REGULAR: { isOpen: true, label: "Market Open" },
          PRE: { isOpen: false, label: "Pre-Market" },
          POST: { isOpen: false, label: "After Hours" },
          CLOSED: { isOpen: false, label: "Market Closed" },
        };
        // Yahoo Finance sometimes returns "POSTPOST" or "PREPRE" for Indian indices
        const raw = (data.state || "CLOSED").toUpperCase();
        const normalized = raw.replace(/^(PRE|POST|REGULAR|CLOSED)\1$/, "$1"); // deduplicate
        const mapped = stateMap[normalized] || stateMap[raw.slice(0, 4)] || { isOpen: false, label: "Market Closed" };
        setStatus(mapped);
      } catch (err) {
        console.error("Failed to fetch market status", err);
      }
    };

    fetchStatus();
    // Poll Yahoo Finance via backend every 60 seconds
    const timer = setInterval(fetchStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', marginLeft: '20px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f8f9fa', fontSize: '0.85rem' }}>
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: status.isOpen ? '#4caf50' : '#f44336'
      }}></span>
      <span style={{ color: '#555', fontWeight: '500' }}>{status.label}</span>
    </div>
  );
};

const TopBar = () => {
  const [indices, setIndices] = useState({
    nifty: { price: 0, percent: "0.00%", isDown: false },
    sensex: { price: 0, percent: "0.00%", isDown: false }
  });

  useEffect(() => {
    const fetchIndices = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=^NSEI,^BSESN`
        );

        const niftyData = data.find(q => q.name === "^NSEI");
        const sensexData = data.find(q => q.name === "^BSESN");

        setIndices({
          nifty: niftyData || { price: 0, percent: "0.00%", isDown: false },
          sensex: sensexData || { price: 0, percent: "0.00%", isDown: false }
        });
      } catch (err) {
        console.error("Failed to fetch indices", err);
      }
    };

    fetchIndices();
    const interval = setInterval(fetchIndices, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="topbar-container">
      <div className="indices-container">
        <div className="nifty">
          <p className="index">NIFTY 50</p>
          <p className="index-points">{indices.nifty.price}</p>
          <p className={`percent ${indices.nifty.isDown ? "down" : "up"}`}>
            {indices.nifty.percent}
          </p>
        </div>
        <div className="sensex">
          <p className="index">SENSEX</p>
          <p className="index-points">{indices.sensex.price}</p>
          <p className={`percent ${indices.sensex.isDown ? "down" : "up"}`}>
            {indices.sensex.percent}
          </p>
        </div>
      </div>

      <MarketStatus />

      <Menu />
    </div>
  );
};

export default TopBar;