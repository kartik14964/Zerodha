import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Skeleton } from "@mui/material";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";
import { useContext } from "react";

import { formatCurrency } from "../utils/currencyFormatter";

const formatINR = (value) => formatCurrency(value, "INR");

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [valuation, setValuation] = useState({ totalInvestmentINR: 0, currentValueINR: 0, totalPnLINR: 0, pnlPercentage: 0 });
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { refreshFlag } = useContext(GeneralContext);
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/allHoldings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        setAllHoldings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const fetchValuation = () => {
      axios
        .get(`${process.env.REACT_APP_BACKEND_URL}/valuation`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setValuation(res.data.holdings))
        .catch((err) => {});
    };
    fetchValuation();
    const interval = setInterval(fetchValuation, 10000);
    return () => clearInterval(interval);
  }, [refreshFlag]);

  useEffect(() => {
    if (allHoldings.length === 0) return;
    // Use the canonical symbol directly from DB, fallback only if missing
    const getYahooSymbol = (h) => h.symbol || h.name;

    const symbols = allHoldings.map(getYahooSymbol).join(",");

    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbols}`);
        const priceMap = {};
        data.forEach(q => {
          const holding = allHoldings.find(h => getYahooSymbol(h) === q.name || h.name === q.name);
          if (holding) {
            priceMap[holding.name] = {
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
      const symbolArray = allHoldings.map(getYahooSymbol);
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (q) => {
        setLivePrices((prev) => {
          const holding = allHoldings.find(h => getYahooSymbol(h) === q.name || h.name === q.name);
          if (holding) {
            return {
              ...prev,
              [holding.name]: {
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
  }, [allHoldings, socket]);


  const totalInvestment = valuation.totalInvestmentINR || 0;
  const totalCurrentValue = valuation.currentValueINR || 0;
  const totalPnL = valuation.totalPnLINR || 0;
  const totalProfitLossPercent = valuation.pnlPercentage || 0;
  

  const labels = allHoldings.map((stock) => stock.name);
  // NOTE: This simple approximation uses native numbers for the chart.
  // In a real multi-currency dashboard, the chart should use the portfolio valuation service.
  const data = {
    labels,
    datasets: [
      {
        label: "Investment Value",
        data: allHoldings.map((stock) => stock.avg * stock.qty),
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Current Value",
        data: allHoldings.map((stock) => {
          const ltp = livePrices[stock.name]?.price || stock.price;
          return ltp * stock.qty;
        }),
        backgroundColor: "rgba(76, 175, 80, 0.7)",
      },
    ],
  };

  return (
    <>
      <h3 className="title">Holdings ({allHoldings.length})</h3>

      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Qty.</th>
              <th>Avg. cost</th>
              <th>LTP</th>
              <th>Cur. val</th>
              <th>P&L</th>
              <th>Net chg.</th>
              <th>Day chg.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4].map((n) => (
                <tr key={n}>
                  <td><Skeleton variant="text" width={80} /></td>
                  <td><Skeleton variant="text" width={30} /></td>
                  <td><Skeleton variant="text" width={60} /></td>
                  <td><Skeleton variant="text" width={60} /></td>
                  <td><Skeleton variant="text" width={80} /></td>
                  <td><Skeleton variant="text" width={60} /></td>
                  <td><Skeleton variant="text" width={40} /></td>
                  <td><Skeleton variant="text" width={40} /></td>
                </tr>
              ))
            ) : allHoldings.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "30px" }}>
                  <img src="https://support.zerodha.com/support-uploads/attachments/43048997530/inline/43085799982.png" alt="No Holdings" style={{ height: "120px", opacity: 0.5 }} />
                  <p style={{ marginTop: "10px", color: "#666" }}>You don't have any stocks in your holdings yet.</p>
                </td>
              </tr>
            ) : (
              allHoldings.map((stock, index) => {
                const liveData = livePrices[stock.name];
                
                const ltp = liveData?.price || stock.price;
                const curValue = ltp * stock.qty;
                const investmentValue = stock.avg * stock.qty;
                const profitLoss = curValue - investmentValue;
                const netChg = ((ltp - stock.avg) / stock.avg) * 100;
                const profClass = profitLoss >= 0 ? "profit" : "loss";
                
                const isDown = liveData ? liveData.isDown : false;
                const dayClass = isDown ? "loss" : "profit";
                const percent = liveData?.percent || "0.00%";
                
                const currency = liveData?.currency || "INR";

                return (
                  <tr key={index}>
                    <td>
                      <div>{stock.name}</div>
                      {stock.exchange && <small style={{color: '#888'}}>{stock.exchange} · {stock.currency}</small>}
                    </td>
                    <td>{stock.qty}</td>
                    <td>{formatCurrency(stock.avg, currency)}</td>
                    <td className={profClass}>{formatCurrency(ltp, currency)}</td>
                    <td>{formatCurrency(curValue, currency)}</td>
                    <td className={profClass}>{formatCurrency(profitLoss, currency)}</td>
                    <td className={profClass}>
                      {netChg >= 0 ? "+" : ""}{netChg.toFixed(2)}%
                    </td>
                    <td className={dayClass}>
                      {percent}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>
            {formatINR(totalInvestment)}
          </h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>
            {formatINR(totalCurrentValue)}
          </h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5 className={totalPnL >= 0 ? "profit" : "loss"}>
            {formatINR(totalPnL)} ({totalProfitLossPercent >= 0 ? "+" : ""}{totalProfitLossPercent.toFixed(2)}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;
