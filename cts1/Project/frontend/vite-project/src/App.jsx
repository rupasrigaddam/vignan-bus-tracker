import { useState, useEffect } from "react";
import RoleSelection from "./components/RoleSelection";
import Login from "./components/Login";
import Register from "./components/Register";
import Homepage from "./components/Homepage";
import BusSchedule from "./components/BusSchedule";
import LiveTracker from "./components/LiveTracker";
import Notifications from "./components/Notifications";
import FeePayment from "./components/FeePayment";
import FeedbackForm from "./components/FeedbackForm";
import AdminDashboard from "./components/AdminDashboard";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("roleSelection");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light"); // 🌗 Theme state

  // ✅ Load existing session if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setIsAuthenticated(true);
      setUser(parsedUser);
      setRole(parsedUser.role);

      // Restore previous page or default to home
      const path = window.location.pathname.replace("/", "") || "home";
      setCurrentPage(path);
    } else {
      setCurrentPage("roleSelection");
    }
  }, []);

  // ✅ Apply and save theme
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // ✅ Handle browser navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace("/", "") || "home";
      setCurrentPage(path);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (page) => {
    setCurrentPage(page);
    window.history.pushState({}, "", `/${page}`);
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
    setRole(userData.role);

    if (userData.role === "admin") navigate("admin");
    else navigate("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    navigate("roleSelection");
  };

  const renderPage = () => {
    if (!isAuthenticated) {
      if (currentPage === "roleSelection") {
        return (
          <RoleSelection
            onSelectRole={(r) => {
              setRole(r);
              navigate("login");
            }}
          />
        );
      }

      if (currentPage === "register") {
        return (
          <Register
            onSwitchToLogin={() => navigate("login")}
            onRegister={handleLogin}
          />
        );
      }

      return (
        <Login
          role={role}
          onSwitchToRegister={() => navigate("register")}
          onLogin={handleLogin}
        />
      );
    }

    if (role === "admin") {
      return (
        <AdminDashboard
          user={user}
          onNavigate={navigate}
          onLogout={handleLogout}
        />
      );
    }

    // 🎯 Student Pages
    switch (currentPage) {
      case "home":
        return <Homepage user={user} onNavigate={navigate} />;
      case "schedule":
        return <BusSchedule onNavigate={navigate} />;
      case "tracker":
        return <LiveTracker onNavigate={navigate} />;
      case "notifications":
        return <Notifications onNavigate={navigate} />;
      case "fee":
        return <FeePayment user={user} onNavigate={navigate} />;
      case "feedback":
        return <FeedbackForm onNavigate={navigate} />;
      default:
        return <Homepage user={user} onNavigate={navigate} />;
    }
  };

  return (
    <div className={`app ${theme}`}>
      {/* 🧭 Navbar for student */}
      {isAuthenticated && role === "student" && (
        <nav className="navbar">
          <div className="nav-brand">
            <span className="bus-icon">🚌</span>
            <span className="brand-name">VignanBusTracker</span>
          </div>

          <div className="nav-links">
            <button
              className={currentPage === "home" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("home")}
            >
              Home
            </button>
            <button
              className={currentPage === "schedule" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("schedule")}
            >
              Bus Schedule
            </button>
            <button
              className={currentPage === "tracker" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("tracker")}
            >
              Live Tracker
            </button>
            <button
              className={currentPage === "notifications" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("notifications")}
            >
              Notifications
            </button>
            <button
              className={currentPage === "fee" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("fee")}
            >
              Fee Payment
            </button>
            <button
              className={currentPage === "feedback" ? "nav-link active" : "nav-link"}
              onClick={() => navigate("feedback")}
            >
              Feedback
            </button>

            {/* 🌗 Theme Toggle Button */}
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>

            <button className="nav-link logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </nav>
      )}

      <div className="main-content">{renderPage()}</div>
    </div>
  );
}

export default App;
