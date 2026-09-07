import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Auth.css";
import toast from "react-hot-toast";

const Signup = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.password.length < 6) {
      toast.error("Please enter a valid email address and a 6-character password.");
      return;
    }

    setLoading(true);
    try {
      const { email, password } = formData;
      const { data } = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/signup`, { email, password });
      toast.success(data.message || "Account Created! You can now log in.");
      setTimeout(() => {
        window.location.replace("/login");
      }, 1500);
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="kite-landing-container">
      <div className="kite-landing-content">
        <div className="kite-illustration">
          <img src="media/images/account_open.svg" alt="Zerodha Ecosystem" />
        </div>
        <div className="kite-signup-section">
          <h1>Signup now</h1>
          <p>Or track your existing application</p>
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
              {loading ? "Creating Account..." : "Continue"}
            </button>
          </form>
          <div className="kite-legal-text">
            By proceeding, you agree to the Zerodha and privacy policy.
            <br /><br />
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;