import React from "react";

import Dashboard from "./Dashboard";
import TopBar from "./TopBar";
import axios from "axios";
import { useEffect } from "react";
const Home = () => {
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await axios.get("https://zerodha-mdj3.onrender.com/me", {
          withCredentials: true,
        });
        if (!res.data.loggedIn) {
          window.location.href = "/login";
        }
      } catch (err) {
        window.location.href = "/login";
      }
    };

    verifySession();
  }, []);
  return (
    <>
      <TopBar />
      <Dashboard />
    </>
  );
};

export default Home;
