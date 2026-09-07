import React, { useState, useContext } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import GeneralContext from "./GeneralContext";

import "./BuyActionWindow.css";

const formatINR = (value) => {
  return Number(value).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const BuyActionWindow = ({ stock }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(stock.nativePrice || stock.price);
  const { closeWindow } = useContext(GeneralContext);
  
  // Dynamically recover the exchange rate used by the backend
  const exchangeRate = (stock.nativePrice && stock.nativePrice !== 0) 
    ? (stock.price / stock.nativePrice) 
    : 1;

  const handleBuyClick = async () => {
    if (stockQuantity <= 0 || stockPrice <= 0) {
      toast.error("Enter valid quantity and price");
      return;
    }

    try {
      const idempotencyKey = uuidv4();
      const executionPriceInr = Number(stockPrice) * exchangeRate;
      
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/newOrder`, {
        name: stock.name,
        qty: Number(stockQuantity),
        price: executionPriceInr,
        mode: "BUY",
        idempotencyKey,
      });

      toast.success(response.data.message);
      closeWindow();
    } catch (error) {
      toast.error(error.response?.data?.message || error.response?.data || "Order failed");
    }
  };
  const handleCancelClick = () => {
    closeWindow();
  };

  return (
    <div className="container" id="buy-window" draggable="true">
      <div className="regular-order">
        <div className="inputs">
          <fieldset>
            <legend>Qty.</legend>
            <input
              type="number"
              name="qty"
              id="qty"
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
            />
          </fieldset>
          <fieldset>
            <legend>Price ({stock.currency || 'INR'})</legend>
            <input
              type="number"
              name="price"
              id="price"
              step="0.05"
              onChange={(e) => setStockPrice(e.target.value)}
              value={stockPrice}
            />
          </fieldset>
        </div>
      </div>

      <div className="buttons">
        <span>
          Margin required{" "}
          {formatINR(Number(stockQuantity) * Number(stockPrice) * exchangeRate)}
        </span>
        <div>
          <button className="btn btn-blue" onClick={handleBuyClick}>
            Buy
          </button>
          <button className="btn btn-grey" onClick={handleCancelClick}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyActionWindow;
