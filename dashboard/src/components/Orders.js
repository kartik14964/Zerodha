import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { formatCurrency } from "../utils/currencyFormatter";

const formatINR = (value) => formatCurrency(value, "INR");

const Orders = () => {
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/allOrders`)
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
          <Link to={"/"} className="btn-primary-blue">
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
                <th>Total Value</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order, index) => {
                // CSS classes for BUY and SELL
                const modeClass = order.mode === "BUY" ? "profit" : "loss";

                return (
                  <tr key={index}>
                    <td>
                      <div>{order.name}</div>
                      {order.exchange && <small style={{color: '#888'}}>{order.exchange} · {order.currency}</small>}
                    </td>
                    <td>{order.qty}</td>
                    <td>{formatCurrency(order.orderPrice || order.price, order.currency)}</td>
                    <td>
                      {formatCurrency(order.totalTransactionValueNative || (order.qty * (order.orderPrice || order.price)), order.currency)}
                      {order.currency !== "INR" && order.totalTransactionValueINR && (
                        <div style={{ fontSize: "0.8em", color: "#666" }}>
                          ({formatINR(order.totalTransactionValueINR)})
                        </div>
                      )}
                    </td>
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