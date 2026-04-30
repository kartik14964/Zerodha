import React, { useEffect, useState } from "react";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  // 1. Check LocalStorage AND the URL for the token
  let token = localStorage.getItem("token");
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get("token");
  
  // 2. If a token arrived via the URL, grab it and hide it!
  if (urlToken) {
    localStorage.setItem("token", urlToken);
    token = urlToken; 
    
    // Instantly scrub the token from the address bar so the user never sees it
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // 3. Verification and Back-Button Protection
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
          window.location.replace("https://zerodhafrontend-g8o8.onrender.comlogin");
        }
      } catch (err) {
        localStorage.removeItem("token");
        window.location.replace("https://zerodhafrontend-g8o8.onrender.comlogin");
      }
    };

    verifyUser();

    // Aggressive Back-Forward Cache Defeater
    const handlePageShow = (event) => {
      if (!localStorage.getItem("token")) {
        document.body.style.display = "none";
        window.location.replace("https://zerodhafrontend-g8o8.onrender.com/login");
      } else if (event.persisted) {
        verifyUser();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [token]);

  // 4. Safe Early Returns
  if (!token) {
    return null; // Prevents the dashboard UI from flashing empty
  }

  if (isAuthenticated === null) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h3>Verifying Session...</h3>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
