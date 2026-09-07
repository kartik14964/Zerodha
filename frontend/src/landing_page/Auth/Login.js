import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./Auth.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 1) {
      toast.error("Password is required.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/login`,
        formData,
      );

      // Save token locally in App 1
      localStorage.setItem("token", response.data.token);

      toast.success("Login successful. Redirecting to dashboard...");
      setTimeout(() => {
        window.location.replace(`${process.env.REACT_APP_DASHBOARD_URL}/?token=${response.data.token}`);
      }, 1500);
    } catch (err) {
      // ... catch block remains the same
      setLoading(false);
      toast.error(err.response?.data?.message || "Invalid credentials. Please try again.");
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
              name="email"
              placeholder="Email address"
              className="kite-input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
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
