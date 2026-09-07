import React, { useState, useEffect } from "react";
import axios from "axios";

import Menu from "./Menu";

const checkMarketStatus = () => {
  const now = new Date();
  
  // Convert current time to IST
  const istOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric', second: 'numeric', weekday: 'short' };
  const parts = new Intl.DateTimeFormat('en-US', istOptions).formatToParts(now);
  
  const getPart = (type) => parts.find(p => p.type === type).value;
  
  const weekday = getPart('weekday');
  const hour = parseInt(getPart('hour'), 10);
  const minute = parseInt(getPart('minute'), 10);
  const second = parseInt(getPart('second'), 10);
  
  // Check if weekend
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { isOpen: false, timeString: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}` };
  }
  
  // Check if between 09:15 and 15:30
  const timeInMinutes = hour * 60 + minute;
  const isOpen = timeInMinutes >= (9 * 60 + 15) && timeInMinutes < (15 * 60 + 30);
  
  return { isOpen, timeString: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}` };
};

const MarketStatus = () => {
  const [status, setStatus] = useState(checkMarketStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(checkMarketStatus());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto', marginLeft: '20px', padding: '4px 10px', borderRadius: '4px', backgroundColor: '#f8f9fa', fontSize: '0.85rem' }}>
      <span style={{ fontWeight: '500' }}>{status.timeString}</span>
      <span style={{
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: status.isOpen ? '#4caf50' : '#f44336'
      }}></span>
      <span style={{ color: '#666' }}>Market {status.isOpen ? 'Open' : 'Closed'}</span>
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