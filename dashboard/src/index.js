import React from "react";
import "./index.css";
import axios from "axios";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import ProtectedRoute from "./components/ProtectedRoute";

axios.defaults.baseURL = `${process.env.REACT_APP_BACKEND_URL}`;

// STAPLE THE TOKEN TO EVERY REQUEST
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// DESTROY TOKEN ON 401
axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.replace(`${process.env.REACT_APP_FRONTEND_URL}`);
      }
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
            <Home /> 
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>,
);