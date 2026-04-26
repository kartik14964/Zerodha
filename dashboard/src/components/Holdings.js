import React, { useState, useEffect } from "react";
import axios from "axios";
import { VerticalGraph } from "./VerticalGraph";
import { watchlist } from "../data/data"; 

const Holdings = () => {
  const [allHoldings, setAllHoldings] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3002/allHoldings", { withCredentials: true })
      .then((res) => {
        setAllHoldings(res.data);
      });
  }, []);


  const totalInvestment = allHoldings.reduce((sum, stock) => sum + (stock.avg * stock.qty), 0);
  
  const totalCurrentValue = allHoldings.reduce((sum, stock) => {
    const marketPrice = watchlist.find((m) => m.name === stock.name)?.price || stock.price;
    return sum + (marketPrice * stock.qty);
  }, 0);

  const totalPnL = totalCurrentValue - totalInvestment;
  

  const labels = allHoldings.map((stock) => stock.name);
  const data = {
    labels,
    datasets: [
      {
        label: "Stock Price",
        data: allHoldings.map((stock) => {
          const marketStock = watchlist.find((s) => s.name === stock.name);
          return marketStock ? marketStock.price : stock.price;
        }),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
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
            {allHoldings.map((stock, index) => {
              const marketStock = watchlist.find((s) => s.name === stock.name);
              const ltp = marketStock ? marketStock.price : stock.price;
              const curValue = ltp * stock.qty;
              const investmentValue = stock.avg * stock.qty;
              const profitLoss = curValue - investmentValue;
              const netChg = ((ltp - stock.avg) / stock.avg) * 100;
              const profClass = profitLoss >= 0 ? "profit" : "loss";
              const dayClass = marketStock?.isDown ? "loss" : "profit";

              return (
                <tr key={index}>
                  <td>{stock.name}</td>
                  <td>{stock.qty}</td>
                  <td>{stock.avg.toFixed(2)}</td>
                  <td className={profClass}>{ltp.toFixed(2)}</td>
                  <td>{curValue.toFixed(2)}</td>
                  <td className={profClass}>{profitLoss.toFixed(2)}</td>
                  <td className={profClass}>
                    {netChg >= 0 ? "+" : ""}{netChg.toFixed(2)}%
                  </td>
                  <td className={dayClass}>
                    {marketStock ? marketStock.percent : "0.00%"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="row">
        <div className="col">
          <h5>{totalInvestment.toFixed(2)}</h5>
          <p>Total investment</p>
        </div>
        <div className="col">
          <h5>{totalCurrentValue.toFixed(2)}</h5>
          <p>Current value</p>
        </div>
        <div className="col">
          <h5 className={totalPnL >= 0 ? "profit" : "loss"}>
            {totalPnL.toFixed(2)}
          </h5>
          <p>P&L</p>
        </div>
      </div>
      <VerticalGraph data={data} />
    </>
  );
};

export default Holdings;
 
