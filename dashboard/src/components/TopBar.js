import React, { useState, useEffect } from "react";
import axios from "axios";

import Menu from "./Menu";



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

      <Menu />

    </div>
  );
};

export default TopBar;