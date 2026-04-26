import React from "react";
import "./index.css";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";

axios.defaults.baseURL = "http://localhost:3002";
axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.replace("http://localhost:3001/login");
    }
    return Promise.reject(err);
  },
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Home /> {/* Home contains your Orders, Holdings, Funds, etc. */}
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>,
);
