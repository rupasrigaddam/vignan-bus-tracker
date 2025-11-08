// src/components/RoleSelection.jsx
import "./RoleSelection.css";

function RoleSelection({ onSelectRole }) {
  return (
    <div className="role-container">
      <div className="role-card">
        <h1 className="role-title">🚌 Vignan Bus Tracker</h1>
        <p className="role-subtitle">Select your role to continue</p>

        <div className="role-buttons">
          <button
            className="role-btn student"
            onClick={() => onSelectRole("student")}
          >
            👨‍🎓 Student Login
          </button>

          <button
            className="role-btn admin"
            onClick={() => onSelectRole("admin")}
          >
            🧑‍💼 Admin Login
          </button>
        </div>

        <footer className="role-footer">
          <p>© {new Date().getFullYear()} Vignan University | Transport Portal</p>
        </footer>
      </div>
    </div>
  );
}

export default RoleSelection;
