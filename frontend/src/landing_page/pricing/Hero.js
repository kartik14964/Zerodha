import React from "react";

function Hero() {
  return (
    <div className="container ">
      <div className="row border-bottom p-5 mt-5 text-center">
        <h1>Pricing</h1>
        <h3 className="text-muted fs-5 mt-3">
          Free equity investments and flat ₹20 intraday and F&O trades
        </h3>
      </div>
      <div className="row p-4 mt-5">
        <div className="col p-5 text center">
          <img src="media/images/pricingEquity.svg" alt="" />
          <h1 className="fs-3">Free equity delivery</h1>
          <p className="text-muted">
            All equity delivery investments (NSE,BSE),are absolutely free - ₹0
            brokerage.
          </p>
        </div>
        <div className="col p-4 text center">
          <img src="media/images/intradayTrades.svg" alt="" />
          <h1 className="fs-3">Intraday and F&O trades</h1>
          <p className="text-muted">
            Flat ₨20 or 0.03% (whichever is lower) per executed order on
            intraday trades acrossequity,currency,and commodity trades.
          </p>
        </div>
        <div className="col p-4 text center">
          <img src="media/images/pricingEquity.svg" alt="" />
          <h1 className="fs-3">Free direct MF</h1>
          <p className="text-muted">
            All direct mutual fund investments are absolutely free. - ₹0
            commissions & DP charges.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Hero;
