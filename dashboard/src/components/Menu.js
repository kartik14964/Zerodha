import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const [username, setUsername] = useState("User");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get("http://localhost:3002/me");

        if (data.loggedIn && data.user) {
          const nameFromEmail = data.user.email.split("@")[0];
          setUsername(nameFromEmail);
        }
      } catch (err) {
        console.error("Could not fetch user details");
      }
    };

    fetchUser();
  }, []);

  const handleMenuClick = (index) => {
    setSelectedMenu(index);
  };

  const handleProfileClick = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:3002/logout");

      localStorage.removeItem("token");

      window.location.replace("http://localhost:3001");
    } catch (err) {
      // Even if the server throws an error, force wipe the token locally
      localStorage.removeItem("token");
      alert("Logout failed. Please try again.");
    }
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="logo.png" style={{ width: "50px" }} alt="Logo" />
      <div className="menus">
        <ul>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/"
              onClick={() => handleMenuClick(0)}
            >
              <p className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                Dashboard
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/orders"
              onClick={() => handleMenuClick(1)}
            >
              <p className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                Orders
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/holdings"
              onClick={() => handleMenuClick(2)}
            >
              <p className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                Holdings
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/positions"
              onClick={() => handleMenuClick(3)}
            >
              <p className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                Positions
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/funds"
              onClick={() => handleMenuClick(4)}
            >
              <p className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                Funds
              </p>
            </Link>
          </li>
          <li>
            <Link
              style={{ textDecoration: "none" }}
              to="/apps"
              onClick={() => handleMenuClick(5)}
            >
              <p className={selectedMenu === 5 ? activeMenuClass : menuClass}>
                Apps
              </p>
            </Link>
          </li>
        </ul>
        <hr />

        <div
          className="profile"
          onClick={handleProfileClick}
          style={{ cursor: "pointer", position: "relative" }}
        >
          {/*  first two letters of the name and capitalizes them */}
          <div className="avatar">{username.substring(0, 2).toUpperCase()}</div>

          {/* Dynamic Username */}
          <p className="username">{username}</p>

          {isProfileDropdownOpen && (
            <div
              className="dropdown-menu show shadow-sm"
              style={{
                position: "absolute",
                top: "100%",
                right: "0",
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                padding: "8px 0",
                minWidth: "120px",
                zIndex: 1000,
              }}
            >
              <button
                onClick={handleLogout}
                className="dropdown-item text-danger"
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
