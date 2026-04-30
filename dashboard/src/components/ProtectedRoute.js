import React, { useEffect, useState } from "react";
import axios from "axios";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  let token = localStorage.getItem("token");
  const tempCookieToken = getCookie("tempToken");
  
  if (tempCookieToken) {
    localStorage.setItem("token", tempCookieToken);
    document.cookie = "tempToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    token = tempCookieToken; 
  }

  useEffect(() => {
    if (!token) {
      console.error("FAILED CHECK 1: No token found in LocalStorage or Cookies.");
      // window.location.replace("http://localhost:3001/login");
      return;
    }

    const verifyUser = async () => {
      try {
        const { data } = await axios.get("https://zerodhabackend-3sw3.onrender.com/me");
        if (data.loggedIn) {
          setIsAuthenticated(true);
        } else {
          console.error("FAILED CHECK 2: Token sent, but backend responded with loggedIn: false.");
          localStorage.removeItem("token");
          // window.location.replace("http://localhost:3001/login");
        }
      } catch (err) {
        console.error("FAILED CHECK 3: The /me API call completely crashed or was blocked.", err.message);
        localStorage.removeItem("token");
        // window.location.replace("http://localhost:3001/login");
      }
    };

    verifyUser();
  }, [token]);

  if (!token) {
    return <h2>Error: No Token! Check your console.</h2>; 
  }

  if (isAuthenticated === null) {
    return <h2>Verifying Session... Please wait.</h2>;
  }

  return children;
};

export default ProtectedRoute;
