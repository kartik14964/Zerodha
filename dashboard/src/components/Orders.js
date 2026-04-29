import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Orders = () => {
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    axios
      .get("https://zerodhabackend-3sw3.onrender.com/allOrders", { withCredentials: true })
      .then((res) => {
        // reverse put recent orders on top
        setAllOrders(res.data.reverse());
      })
      .catch((err) => console.log("Fetch Error:", err));
  }, []);

  return (
    <div className="orders">
      {/* If length is 0 show  exact empty state */}
      {allOrders.length === 0 ? (
        <div className="no-orders">
          <p>You haven't placed any orders today</p>
          <Link to={"/"} className="btn">
            Get started
          </Link>
        </div>
      ) : (
        /* If there ARE orders show the table */
        <div className="order-table">
          <h3 className="title">Order History ({allOrders.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Qty.</th>
                <th>Avg. Price</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order, index) => {
                // CSS classes for BUY and SELL
                const modeClass = order.mode === "BUY" ? "profit" : "loss";

                return (
                  <tr key={index}>
                    <td>{order.name}</td>
                    <td>{order.qty}</td>
                    <td>{order.price.toFixed(2)}</td>
                    <td className={modeClass}>
                      <strong>{order.mode}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;