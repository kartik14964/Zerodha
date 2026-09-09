import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const Menu = () => {
  const [selectedMenu, setSelectedMenu] = useState(0);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });

  const profileRef = useRef(null);
  const [username, setUsername] = useState("User");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setSelectedMenu(0);
    else if (path === "/orders") setSelectedMenu(1);
    else if (path === "/holdings") setSelectedMenu(2);
    else if (path === "/positions") setSelectedMenu(3);
    else if (path === "/funds") setSelectedMenu(4);
    else if (path === "/apps") setSelectedMenu(5);
  }, [location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/me`);

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
    if (!isProfileDropdownOpen && profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      const isInBottomHalf = rect.top > window.innerHeight / 2;

      if (isInBottomHalf) {
        // Mobile bottom nav: open dropdown above the button
        setDropdownPos({
          bottom: window.innerHeight - rect.top + 8,
          right: window.innerWidth - rect.right,
          top: "auto",
        });
      } else {
        // Desktop top bar: open dropdown below the button
        setDropdownPos({
          top: rect.bottom + 6,
          right: window.innerWidth - rect.right,
          bottom: "auto",
        });
      }
    }
    setIsProfileDropdownOpen((prev) => !prev);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileDropdownOpen]);

  const handleLogout = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/logout`);
      localStorage.removeItem("token");
      window.location.href = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3001";
    } catch (err) {
      localStorage.removeItem("token");
      window.location.href = process.env.REACT_APP_FRONTEND_URL || "http://localhost:3001";
    }
  };

  const menuClass = "menu";
  const activeMenuClass = "menu selected";

  return (
    <div className="menu-container">
      <img src="logo.png" className="nav-logo" style={{ width: "50px" }} alt="Logo" />
      <div className="menus">
        <ul>
          <li>
            <Link style={{ textDecoration: "none" }} to="/" onClick={() => handleMenuClick(0)}>
              <div className={selectedMenu === 0 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-compass mobile-nav-icon"></i>
                <p>Dashboard</p>
              </div>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/orders" onClick={() => handleMenuClick(1)}>
              <div className={selectedMenu === 1 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-book mobile-nav-icon"></i>
                <p>Orders</p>
              </div>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/holdings" onClick={() => handleMenuClick(2)}>
              <div className={selectedMenu === 2 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-briefcase mobile-nav-icon"></i>
                <p>Holdings</p>
              </div>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/positions" onClick={() => handleMenuClick(3)}>
              <div className={selectedMenu === 3 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-chart-pie mobile-nav-icon"></i>
                <p>Positions</p>
              </div>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/funds" onClick={() => handleMenuClick(4)}>
              <div className={selectedMenu === 4 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-wallet mobile-nav-icon"></i>
                <p>Funds</p>
              </div>
            </Link>
          </li>
          <li>
            <Link style={{ textDecoration: "none" }} to="/apps" onClick={() => handleMenuClick(5)}>
              <div className={selectedMenu === 5 ? activeMenuClass : menuClass}>
                <i className="fa-solid fa-shapes mobile-nav-icon"></i>
                <p>Apps</p>
              </div>
            </Link>
          </li>
          {/* Profile avatar as the last nav item — perfectly matching the standard li structure */}
          <li ref={profileRef} className="profile-nav-item" onClick={handleProfileClick} style={{ cursor: "pointer" }}>
            <div style={{ textDecoration: "none" }}>
              <div className={menuClass} style={{
                borderLeft: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div className="avatar" style={{
                  margin: '0',
                  width: '24px',
                  height: '24px',
                  fontSize: '0.65rem',
                  minHeight: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgb(252, 229, 252)',
                  color: 'rgb(221, 139, 221)',
                  borderRadius: '100%',
                  flexShrink: '0'
                }}>
                  {username.substring(0, 2).toUpperCase()}
                </div>
                <p className="username">{username}</p>
                <p className="mobile-profile-label">Profile</p>
              </div>
            </div>



            {isProfileDropdownOpen && (
              <div
                className="dropdown-menu show shadow-sm"
                style={{
                  position: "fixed",
                  top: dropdownPos.top !== "auto" ? `${dropdownPos.top}px` : "auto",
                  bottom: dropdownPos.bottom !== "auto" ? `${dropdownPos.bottom}px` : "auto",
                  right: `${dropdownPos.right}px`,
                  backgroundColor: "white",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  padding: "8px 0",
                  minWidth: "130px",
                  zIndex: 99999,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
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
                    color: "#d32f2f",
                    fontSize: "0.85rem",
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </li>

        </ul>
      </div>
    </div >
  );
};

export default Menu;