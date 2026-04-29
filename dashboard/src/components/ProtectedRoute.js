import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper function to extract a specific cookie
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const ProtectedRoute = ({ children }) => {
  // 1. ALL HOOKS MUST BE DECLARED AT THE VERY TOP
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // 2. Synchronous logic (No early returns here!)
  let token = localStorage.getItem("token");
  const tempCookieToken = getCookie("tempToken");
  
  if (tempCookieToken) {
    localStorage.setItem("token", tempCookieToken);
    document.cookie = "tempToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    token = tempCookieToken; 
  }

  // 3. SIDE EFFECTS 
  useEffect(() => {
    if (!token) {
      window.location.replace("https://zerodhafrontend-g8o8.onrender.com/login");
      return;
    }

    const verifyUser = async () => {
      try {
        const { data } = await axios.get("https://zerodhabackend-3sw3.onrender.com/me");
        if (data.loggedIn) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          window.location.replace("https://zerodhafrontend-g8o8.onrender.com/login");
        }
      } catch (err) {
        localStorage.removeItem("token");
        window.location.replace("https://zerodhafrontend-g8o8.onrender.com/login");
      }
    };

    verifyUser();

    // Aggressive Browser Cache Defeater
    const handlePageShow = (event) => {
      if (!localStorage.getItem("token")) {
        document.body.style.display = "none";
        window.location.replace("http://localhost:3001/login");
      } else if (event.persisted) {
        verifyUser();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [token]);

  // 4. NOW WE CAN SAFELY RETURN EARLY 
  if (!token) {
    return null; // Prevents the dashboard UI from flashing on the screen
  }

  if (isAuthenticated === null) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h3>Verifying Session...</h3>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;