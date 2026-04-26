import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./Auth.css";
import Swal from "sweetalert2";

const Signup = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email) || formData.password.length < 6) {
      return Swal.fire(
        "Oops!",
        "Please enter a valid email address and a 6-character password.",
        "warning",
      );
    }

    setLoading(true);
    try {
      const { email, password } = formData;
      const { data } = await axios.post(
        "http://localhost:3002/signup",
        { email, password },
        { withCredentials: true },
      );
      Swal.fire({
        title: "Account Created!",
        text: data.message || "You can now log in to start trading.",
        icon: "success",
        confirmButtonColor: "#387ed1",
        confirmButtonText: "Go to Login",
      }).then((result) => {
        window.location.href = "/login";
      });
    } catch (err) {
      setLoading(false);
      const serverMsg = err.response?.data?.message || "Signup failed.";

      // Error pop up
      Swal.fire({
        title: "Error",
        text: serverMsg,
        icon: "error",
        confirmButtonColor: "#df514c",
      });
    }
  };

  return (
    <div className="kite-landing-container">
      <div className="kite-landing-content">
        {/* Left Side: Illustration  */}
        <div className="kite-illustration">
          <img src="media/images/account_open.svg" alt="Zerodha Ecosystem" />
        </div>

        {/* // Right Side */}
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
            <br />
            <br />
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
