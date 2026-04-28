import { useEffect, useState, useCallback } from "react";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  
  const loginFrontendUrl = "https://zerodha-frontend-cgha.onrender.com/login"; 

  const checkAuth = useCallback(async () => {
    setIsChecking(true); 
    try {
      const { data } = await axios.get("https://zerodha-mdj3.onrender.com/me", {
        withCredentials: true, 
      });

      if (data.loggedIn) {
        setIsAuthenticated(true);
        setIsChecking(false);
      } else {
        window.location.replace(loginFrontendUrl); 
      }
    } catch (err) {
      window.location.replace(loginFrontendUrl);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handlePageShow = (event) => {
      if (event.persisted) {
        checkAuth(); 
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20vh" }}>
        <h2>Loading securely...</h2>
      </div>
    );
  }

  return isAuthenticated ? children : null;
};

export default ProtectedRoute;
