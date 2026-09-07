import React, { useState, useEffect } from "react";
import axios from "axios";
import { DoughnutChart } from "./DoughnutChart";

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Summary = () => {
  const [holdings, setHoldings] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [walletBalance, setWalletBalance] = useState(100000);
  const [livePrices, setLivePrices] = useState({});

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
      .then((res) => {
        setUserEmail(res.data.user.email);
        if (res.data.user.balance !== undefined) {
          setWalletBalance(res.data.user.balance);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  // Fetch live prices for holdings
  useEffect(() => {
    if (holdings.length === 0) return;
    
    const getYahooSymbol = (name) => {
      if (!name.includes(".") && !name.includes("-") && !name.startsWith("^")) {
        return name + ".NS";
      }
      return name;
    };

    const symbols = holdings.map((h) => getYahooSymbol(h.name)).join(",");

    const fetchPrices = async () => {
      try {
        const { data } = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/quotes?symbols=${symbols}`
        );
        const priceMap = {};
        data.forEach((q) => {
          const holding = holdings.find(h => getYahooSymbol(h.name) === q.name);
          if (holding) {
            priceMap[holding.name] = q.price;
          }
        });
        setLivePrices(priceMap);
      } catch (err) {}
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, [holdings]);
  const rawName = userEmail ? userEmail.split("@")[0] : "User";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  let totalInvestment = 0;
  let totalCurrentValue = 0;

  // Loop through database stocks one by one
  holdings.forEach((stock) => {
    // Find the live price from our Yahoo fetch or fallback
    const livePrice = livePrices[stock.name] || stock.price;

    // Add to our totals
    totalInvestment = totalInvestment + stock.avg * stock.qty;
    totalCurrentValue = totalCurrentValue + livePrice * stock.qty;
  });

  // Calculate final numbers
  const totalPnL = totalCurrentValue - totalInvestment;
  const isProfit = totalPnL >= 0;

  // Wallet numbers
  const marginAvailable = walletBalance;
  const openingBalance = walletBalance + totalInvestment;

  // Doughnut Chart Data for Asset Allocation
  const doughnutData = {
    labels: holdings.map((stock) => stock.name),
    datasets: [
      {
        label: "Current Value",
        data: holdings.map((stock) => {
          const livePrice = livePrices[stock.name] || stock.price;
          return livePrice * stock.qty;
        }),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
          "rgba(255, 159, 64, 0.7)",
          "rgba(199, 199, 199, 0.7)",
          "rgba(83, 102, 255, 0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

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
            <h3>{formatINR(marginAvailable)}</h3>
            <p>Margin available</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Margins used <span>{formatINR(totalInvestment)}</span>
            </p>
            <p>
              Opening balance <span>{formatINR(openingBalance)}</span>
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
              {formatINR(totalPnL)}
            </h3>
            <p>P&L</p>
          </div>
          <hr />
          <div className="second">
            <p>
              Current Value{" "}
              <span>{formatINR(totalCurrentValue)}</span>
            </p>
            <p>
              Investment <span>{formatINR(totalInvestment)}</span>
            </p>
          </div>
        </div>
        <hr className="divider" />
      </div>

      <div className="section" style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <div style={{ width: '40%', minWidth: '300px', textAlign: 'center' }}>
          <h4 style={{ marginBottom: '1rem', color: '#444' }}>Asset Allocation</h4>
          {holdings.length > 0 ? (
            <DoughnutChart data={doughnutData} />
          ) : (
            <p>No holdings to display.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Summary;
