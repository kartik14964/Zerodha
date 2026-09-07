import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Skeleton } from "@mui/material";
import { VerticalGraph } from "./VerticalGraph";
import GeneralContext from "./GeneralContext";
import { useContext } from "react";

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);
  const [livePrices, setLivePrices] = useState({});
  const [loading, setLoading] = useState(true);
  const socket = useSocket();
  const { refreshFlag } = useContext(GeneralContext);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_BACKEND_URL}/allHoldings`)
      .then((res) => {
        setAllHoldings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshFlag]);

  useEffect(() => {
    if (allHoldings.length === 0) return;
    
    // Format symbols for Yahoo Finance: 
    // If it's a legacy stock (no special chars like . or - or ^), append .NS
    // Otherwise, it's already a valid Yahoo ticker (e.g. BTC-USD, RELIANCE.NS, ^NSEI)
    const getYahooSymbol = (name) => {
      if (!name.includes(".") && !name.includes("-") && !name.startsWith("^")) {
        return name + ".NS";
      }
      return name;
    };

    const symbols = allHoldings.map((h) => getYahooSymbol(h.name)).join(",");

    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbols}`);
        const priceMap = {};
        data.forEach(q => {
          const holding = allHoldings.find(h => getYahooSymbol(h.name) === q.name);
          if (holding) {
            priceMap[holding.name] = {
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
      const symbolArray = allHoldings.map((h) => getYahooSymbol(h.name));
      socket.emit("subscribe", symbolArray);

      const handlePriceUpdate = (q) => {
        setLivePrices((prev) => {
          const holding = allHoldings.find(h => getYahooSymbol(h.name) === q.name);
          if (holding) {
            return {
              ...prev,
              [holding.name]: {
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
  }, [allHoldings, socket]);


  const totalInvestment = allHoldings.reduce((sum, stock) => sum + (stock.avg * stock.qty), 0);
  
  const totalCurrentValue = allHoldings.reduce((sum, stock) => {
    const marketPrice = livePrices[stock.name]?.price || stock.price;
    return sum + (marketPrice * stock.qty);
  }, 0);

  const totalPnL = totalCurrentValue - totalInvestment;
  const totalProfitLossPercent = totalInvestment === 0 ? 0 : (totalPnL / totalInvestment) * 100;
  

  const labels = allHoldings.map((stock) => stock.name);
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

                return (
                  <tr key={index}>
                    <td>{stock.name}</td>
                    <td>{stock.qty}</td>
                    <td>{formatINR(stock.avg)}</td>
                    <td className={profClass}>{formatINR(ltp)}</td>
                    <td>{formatINR(curValue)}</td>
                    <td className={profClass}>{formatINR(profitLoss)}</td>
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
            {totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            {formatINR(totalPnL)} (+{totalProfitLossPercent.toFixed(2)}%)
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;
