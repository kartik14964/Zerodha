import React, { useState, useContext } from "react";
import Swal from "sweetalert2";
import axios from "axios";

import GeneralContext from "./GeneralContext";

import "./BuyActionWindow.css";

const BuyActionWindow = ({ stock }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(stock.price);
  const { closeWindow } = useContext(GeneralContext);

  const handleBuyClick = async () => {
    if (stockQuantity <= 0 || stockPrice <= 0) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Enter valid quantity and price",
      });
      return;
    }

    try {
      const response = await axios.post("http://localhost:3002/newOrder", {
        name: stock.name,
        qty: Number(stockQuantity),
        price: Number(stockPrice),
        mode: "BUY",
      });

      Swal.fire({
        icon: "success",
        title: "Buy Successful",
        text: response.data.message,
      });

      closeWindow();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Buy Failed",
        text: error.response?.data || "Order failed",
      });
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
            <legend>Price</legend>
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
          Margin required ₹
          {(Number(stockQuantity) * Number(stockPrice)).toFixed(2)}
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
