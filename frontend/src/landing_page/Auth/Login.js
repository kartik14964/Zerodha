import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Use useNavigate for React routing
import Swal from "sweetalert2";
import "./Auth.css";

// Move Regex outside the component for better performance
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  // Single handler for all inputs (Clean & Scalable)
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    // Fast Validation using Swal
    if (!EMAIL_REGEX.test(email)) {
      return Swal.fire(
        "Invalid Email",
        "Please enter a valid email address.",
        "warning",
      );
    }
    if (password.length < 1) {
      return Swal.fire("Missing Password", "Password is required.", "warning");
    }

    setLoading(true);
    try {
      await axios.post("https://zerodha-mdj3.onrender.com/login", formData, {//backend
        withCredentials: true,
      });

      // Success Notification
      Swal.fire({
        title: "Welcome Back!",
        text: "Login successful. Redirecting to dashboard...",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        // Use navigate to avoid a full page reload on your Mac
        window.location.href = "https://zerodha-dashboard-4kom.onrender.com/";
      });
    } catch (err) {
      setLoading(false);
      Swal.fire({
        title: "Login Failed",
        text:
          err.response?.data?.message ||
          "Invalid credentials. Please try again.",
        icon: "error",
        confirmButtonColor: "#df514c",
      });
    }
  };

  return (
    <div className="kite-landing-container">
      <div className="kite-landing-content">
        <div className="kite-illustration">
          <img src="media/images/account_open.svg" alt="Login Illustration" />
        </div>

        <div className="kite-signup-section">
          <h1>Login to Kite</h1>
          <p>Enter your credentials to continue trading</p>

          <form onSubmit={handleSubmit}>
            <input
              type="email"
              name="email" // Must match key in formData
              placeholder="Email address"
              className="kite-input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password" // Must match key in formData
              placeholder="Password"
              className="kite-input-field"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <button type="submit" className="kite-blue-btn" disabled={loading}>
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>

          <div className="kite-legal-text">
            Don't have an account? <Link to="/signup">Signup now</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
