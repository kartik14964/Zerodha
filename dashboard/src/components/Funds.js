import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import GeneralContext from "./GeneralContext";
import { useContext } from "react";

ChartJS.register(ArcElement, ChartTooltip, Legend);

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const Funds = () => {
  // Track the actual balance and used margin from the server
  const [balance, setBalance] = useState(0);
  const [usedMargin, setUsedMargin] = useState(0);
  const { refreshFlag } = useContext(GeneralContext);

  useEffect(() => {
    // Fetch the actual user balance from the session
    const fetchFunds = async () => {
      try {
        const userRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/me`);
        if (userRes.data.loggedIn) {
          setBalance(userRes.data.user.balance);
        }

        //  Fetch holdings to calculate "Used Margin"
        const holdingsRes = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/allHoldings`);
        
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
  }, [refreshFlag]);

  const handleAddFunds = async () => {
    const { value: amount } = await Swal.fire({
      title: "Add Funds",
      input: "number",
      inputLabel: "Enter amount to add (₹)",
      inputPlaceholder: "e.g. 10000",
      showCancelButton: true,
      confirmButtonText: "Add Money",
      confirmButtonColor: "#4caf50",
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return "Please enter a valid amount!";
        }
      }
    });

    if (amount) {
      try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/addFunds`, {
          amount: Number(amount)
        }, { withCredentials: true });
        
        setBalance(res.data.balance);
        toast.success(`Successfully added ₹${amount} to your account!`);
      } catch (err) {
        console.error(err);
        toast.error("Failed to add funds. Please try again.");
      }
    }
  };

  const handleWithdrawFunds = async () => {
    const { value: amount } = await Swal.fire({
      title: "Withdraw Funds",
      input: "number",
      inputLabel: "Enter amount to withdraw (₹)",
      inputPlaceholder: "e.g. 10000",
      showCancelButton: true,
      confirmButtonText: "Withdraw Money",
      confirmButtonColor: "#4184f3",
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return "Please enter a valid amount!";
        }
        if (Number(value) > balance) {
          return "Insufficient funds to withdraw!";
        }
      }
    });

    if (amount) {
      try {
        const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/withdrawFunds`, {
          amount: Number(amount)
        }, { withCredentials: true });
        
        setBalance(res.data.balance);
        toast.success(`Successfully withdrew ₹${amount} from your account!`);
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Failed to withdraw funds. Please try again.");
      }
    }
  };

  const availableCash = balance;
  const openingBalance = balance + usedMargin;
  
  // Doughnut chart for margin
  const marginData = {
    labels: ['Available Margin', 'Used Margin'],
    datasets: [
      {
        data: [availableCash, usedMargin === 0 ? 1 : usedMargin], // Prevent 0/0 empty chart
        backgroundColor: ['#4caf50', '#e0e0e0'],
        borderWidth: 0,
        cutout: '80%',
      },
    ],
  };

  return (
    <div className="funds-interface">
      <div className="funds-header">
        <div>
          <p className="instant-text">Instant, zero-cost fund transfers with UPI</p>
        </div>
        <div className="funds-actions">
          <button className="btn btn-green" onClick={handleAddFunds}>Add funds</button>
          <button className="btn btn-blue" onClick={handleWithdrawFunds}>Withdraw</button>
        </div>
      </div>

      <div className="funds-grid">
        <div className="funds-col">
          <h3 className="funds-title">
            <i className="fa-solid fa-chart-pie section-icon"></i> Equity
          </h3>

          <div className="funds-summary">
            <div className="margin-chart-container">
              <div className="chart-wrapper" style={{ width: '150px', height: '150px', position: 'relative' }}>
                <Doughnut data={marginData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } } }} />
                <div className="chart-center-text" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#888', display: 'block' }}>Margin</span>
                  <span style={{ fontSize: '16px', color: '#4caf50' }}>{((availableCash / (openingBalance || 1)) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="margin-stats">
              <div className="stat-row">
                <span>Available margin</span>
                <span className="val highlight-blue">{formatINR(availableCash)}</span>
              </div>
              <div className="stat-row">
                <span>Used margin</span>
                <span className="val">{formatINR(usedMargin)}</span>
              </div>
              <div className="stat-row">
                <span>Available cash</span>
                <span className="val">{formatINR(availableCash)}</span>
              </div>
              <div className="stat-row total-row">
                <span>Opening Balance</span>
                <span className="val">{formatINR(openingBalance)}</span>
              </div>
            </div>
          </div>

          <div className="funds-breakdown">
            <div className="breakdown-col">
              <div className="stat-row"><span>Payin</span><span>0.00</span></div>
              <div className="stat-row"><span>SPAN</span><span>0.00</span></div>
              <div className="stat-row"><span>Delivery margin</span><span>0.00</span></div>
              <div className="stat-row"><span>Exposure</span><span>0.00</span></div>
              <div className="stat-row"><span>Options premium</span><span>0.00</span></div>
            </div>
            <div className="breakdown-col">
              <div className="stat-row"><span>Collateral (Liquid funds)</span><span>0.00</span></div>
              <div className="stat-row"><span>Collateral (Equity)</span><span>0.00</span></div>
              <div className="stat-row total-row"><span>Total Collateral</span><span>0.00</span></div>
            </div>
          </div>
        </div>

        <div className="funds-col">
          <div className="commodity-banner">
            <p>You don't have a commodity account</p>
            <Link to="#" className="btn btn-blue-outline">Open Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Funds;