import { useEffect, useState } from "react";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await axios.get("https://zerodha-mdj3.onrender.com/me", {
          withCredentials: true,
        });

        if (data.loggedIn) {
          setIsAuthenticated(true); // Cookie valid, allow access
        } else {
          window.location.href = "https://zerodha-frontend-h6i8.onrender.com/";
        }
      } catch (err) {
        window.location.href = "https://zerodha-frontend-h6i8.onrender.com/";
      } finally {
        // Stop the loading spinner whether it succeeded or failed
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  // Show a loading screen while we wait for the backend to check the cookie
  if (isChecking) {
    return (
      <div style={{ display: "flex", justifyContent: "center", marginTop: "20vh" }}>
        <h2>Loading securely...</h2>
      </div>
    );
  }

  // Only render the actual dashboard if the backend confirmed they are logged in
  return isAuthenticated ? children : null;
};

export default ProtectedRoute;

