import { useState } from "react";
import axios from "axios";
import "./Register.css";

const API_URL = "http://localhost:5000/api";

function Register({ onSwitchToLogin, onRegister }) {
  const [formData, setFormData] = useState({
    studentId: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      // Prepare data to send (with role)
      const { confirmPassword, ...registerData } = formData;
      const dataToSend = { ...registerData, role: "student" };

      const response = await axios.post(`${API_URL}/auth/register`, dataToSend);

      // Call parent callback (for storing token/user)
      if (onRegister) {
        onRegister(response.data.token, response.data.user);
      }

      // Success message
      setMessage("✅ Registration successful!");
      console.log("Response:", response.data);

      // Optionally store token in localStorage
      localStorage.setItem("token", response.data.token);
    } catch (err) {
      console.error("Registration error:", err);
      setMessage(err.response?.data?.message || "❌ Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🚌</div>
          <h1>VignanBusTracker</h1>
          <p>Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Student Registration</h2>

          {message && (
            <div
              className={`message-box ${
                message.startsWith("✅") ? "success-message" : "error-message"
              }`}
            >
              {message}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="Enter your student ID"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <div className="auth-footer">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={onSwitchToLogin}
              >
                Login here
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
