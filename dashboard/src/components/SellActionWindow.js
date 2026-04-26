import React, { useState, useContext } from "react";
import axios from "axios";
import GeneralContext from "./GeneralContext";
import Swal from "sweetalert2";
import "./BuyActionWindow.css";

const SellActionWindow = ({ stock, holdings }) => {
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockPrice, setStockPrice] = useState(stock.price);
  const { closeWindow } = useContext(GeneralContext);

  // Find the holding for this stock
  const holding = holdings.find((item) => item.name === stock.name);
  const availableQty = holding ? holding.qty : 0;

  // Check if user can sell this quantity
  const canSell =
    parseInt(stockQuantity) <= availableQty && parseInt(stockQuantity) > 0;

  const handleSellClick = async () => {
    if (!canSell) {
      Swal.fire({
        icon: "error",
        title: "Cannot Sell",
        text: `You can only sell up to ${availableQty} shares!`,
      });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:3002/newOrder",
        {
          name: stock.name,
          qty: stockQuantity,
          price: stockPrice,
          mode: "SELL",
        },
        { withCredentials: true },
      );

      Swal.fire({
        icon: "success",
        title: "Sell Successful",
        text: response.data.message,
      });
      closeWindow();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Order failed";
      Swal.fire({
        icon: "error",
        title: "Sell Failed",
        text: errorMessage,
      });
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
            <legend>Price</legend>
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
          Credit expected: ₹
          {(Number(stockQuantity) * Number(stockPrice)).toFixed(2)}
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
