import React, { useState, useContext } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import GeneralContext from "./GeneralContext";
import toast from "react-hot-toast";
import "./BuyActionWindow.css";

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const SellActionWindow = ({ stock, holdings }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(stock.nativePrice || stock.price);
  const { closeWindow, triggerRefresh } = useContext(GeneralContext);
  
  // Dynamically recover the exchange rate used by the backend
  const exchangeRate = (stock.nativePrice && stock.nativePrice !== 0) 
    ? (stock.price / stock.nativePrice) 
    : 1;

  // Find the holding for this stock
  const holding = holdings.find((item) => item.name === stock.name);
  const availableQty = holding ? holding.qty : 0;

  // Check if user can sell this quantity
  const canSell =
    parseInt(stockQuantity) <= availableQty && parseInt(stockQuantity) > 0;

  const handleSellClick = async () => {
    if (!canSell) {
      toast.error(`You can only sell up to ${availableQty} shares!`);
      return;
    }

    try {
      const idempotencyKey = uuidv4();
      const executionPriceInr = Number(stockPrice) * exchangeRate;
      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/newOrder`, {
        name: stock.name,
        symbol: stock.symbol || stock.name,
        qty: Number(stockQuantity),
        price: executionPriceInr,
        mode: "SELL",
        idempotencyKey,
      });

      toast.success(response.data.message);
      triggerRefresh();
      closeWindow();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Order failed";
      toast.error(errorMessage);
    }
  };

  const handleCancelClick = () => {
    closeWindow();
  };

  return (
    <div className="container" id="sell-window" draggable="true">
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              max={availableQty}
            />
            <small
              style={{ color: "#666", marginTop: "5px", display: "block" }}
            >
              Available: {availableQty} shares
            </small>
          </fieldset>

          <fieldset>
            <legend>Price ({stock.currency || 'INR'})</legend>
            <input
              type="number"
              step="0.05"
              value={stockPrice}
              onChange={(e) => setStockPrice(e.target.value)}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>
          Credit expected:{" "}
          {formatINR(Number(stockQuantity) * Number(stockPrice) * exchangeRate)}
        </span>
        <div>
          <button
            className="btn btn-blue"
            onClick={handleSellClick}
            disabled={!canSell}
            style={{
              opacity: canSell ? 1 : 0.5,
              cursor: canSell ? "pointer" : "not-allowed",
            }}
          >
            Sell
          </button>

          <button className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellActionWindow;
