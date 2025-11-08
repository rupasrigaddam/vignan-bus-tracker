import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";

function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [newRoute, setNewRoute] = useState({ routeName: "", area: "", stops: [] });
  const [attendance, setAttendance] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [report, setReport] = useState(null);
  const token = localStorage.getItem("token");

  // ✅ Fetch routes, buses, users, and alerts initially
  useEffect(() => {
    if (!token) return;
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [routeRes, busRes, userRes, alertRes] = await Promise.all([
        fetch("http://localhost:5000/api/routes", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/buses", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/api/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRoutes(await routeRes.json());
      setBuses(await busRes.json());
      setStudents(await userRes.json());
      setAlerts(await alertRes.json());
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // ✅ Add New Route
  const handleAddRoute = async () => {
    if (!newRoute.routeName || !newRoute.area) {
      alert("Please fill in Route Name and Area");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/routes/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoute),
      });

      const data = await res.json();
      if (res.ok) {
        alert("New route added successfully!");
        setNewRoute({ routeName: "", area: "", stops: [] });
        fetchData();
      } else {
        alert(data.message || "Failed to add route");
      }
    } catch (err) {
      console.error("Error adding route:", err);
    }
  };

  // ✅ Update Schedule (Route)
  const handleUpdateSchedule = async (routeId) => {
    const routeToUpdate = routes.find((r) => r._id === routeId);
    if (!routeToUpdate) return alert("Route not found");

    const updatedName = prompt("Enter new route name:", routeToUpdate.routeName);
    if (!updatedName) return;

    try {
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...routeToUpdate, routeName: updatedName }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Route updated successfully!");
        fetchData();
      } else alert(data.message);
    } catch (err) {
      console.error("Error updating route:", err);
    }
  };

  // ✅ Assign Driver
  const handleAssignDriver = async (busNumber) => {
    const driverName = prompt("Enter driver name:");
    const driverPhone = prompt("Enter driver phone number:");
    if (!driverName || !driverPhone) return alert("Both fields are required");

    try {
      const res = await fetch(
        `http://localhost:5000/api/buses/${busNumber}/assign-driver`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ driverName, driverPhone }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Driver assigned successfully!");
        fetchData();
      } else alert(data.message);
    } catch (err) {
      console.error("Error assigning driver:", err);
    }
  };

  // ✅ View Route Report
  const handleViewReport = async (routeName) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/routes/report/${routeName}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) setReport(data);
      else alert(data.message);
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  // ✅ Collect Fees
  const handleCollectFee = async (studentId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/users/${studentId}/fee`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ feePaid: true }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Fee marked as paid!");
        fetchData();
      } else alert(data.message);
    } catch (err) {
      console.error("Error collecting fee:", err);
    }
  };

  // ✅ Mark Attendance
  const handleMarkAttendance = async (studentId, routeName) => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentId, routeName, status: "Present" }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Attendance marked!");
        fetchAttendance();
      } else alert(data.message);
    } catch (err) {
      console.error("Error marking attendance:", err);
    }
  };

  // ✅ View Attendance Summary
  const fetchAttendance = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAttendance(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  // ✅ Send Alert
  const handleSendAlert = async () => {
    if (!message.trim()) return alert("Enter a message");
    try {
      const res = await fetch("http://localhost:5000/api/alerts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Alert sent!");
        setMessage("");
        fetchData();
      } else alert(data.message);
    } catch (err) {
      console.error("Error sending alert:", err);
    }
  };

  // ✅ Render Content
  const renderContent = () => {
    switch (activeTab) {
      case "routes":
        return (
          <section className="admin-section">
            <h2>🛣 Manage Bus Routes & Stops</h2>
            <input
              placeholder="Route Name"
              value={newRoute.routeName}
              onChange={(e) =>
                setNewRoute({ ...newRoute, routeName: e.target.value })
              }
            />
            <input
              placeholder="Area"
              value={newRoute.area}
              onChange={(e) => setNewRoute({ ...newRoute, area: e.target.value })}
            />
            <button className="action-btn" onClick={handleAddRoute}>
              Add New Route
            </button>
            <ul>
              {routes.map((r) => (
                <li key={r._id}>
                  {r.routeName} - {r.area}
                  <button
                    className="mini-btn"
                    onClick={() => handleUpdateSchedule(r._id)}
                  >
                    Update
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );

      case "drivers":
        return (
          <section className="admin-section">
            <h2>👨‍✈️ Driver Management</h2>
            <ul>
              {buses.map((b) => (
                <li key={b._id}>
                  {b.busNumber} - {b.route} ({b.driverName || "Unassigned"})
                  <button
                    className="mini-btn"
                    onClick={() => handleAssignDriver(b.busNumber)}
                  >
                    Assign Driver
                  </button>
                  <button
                    className="mini-btn"
                    onClick={() => handleViewReport(b.route)}
                  >
                    View Report
                  </button>
                </li>
              ))}
            </ul>
            {report && (
              <div className="report-box">
                <h3>📄 Route Report: {report.routeName}</h3>
                <p>Total Buses: {report.totalBuses}</p>
                <p>Total Students: {report.totalStudents}</p>
              </div>
            )}
          </section>
        );

      case "fees":
        return (
          <section className="admin-section">
            <h2>💰 Transport Fee Management</h2>
            <ul>
              {students
                .filter((s) => s.role === "student")
                .map((s) => (
                  <li key={s._id}>
                    {s.name} ({s.studentId}) -{" "}
                    {s.feePaid ? "✅ Paid" : "❌ Pending"}
                    {!s.feePaid && (
                      <button
                        className="mini-btn"
                        onClick={() => handleCollectFee(s._id)}
                      >
                        Collect
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </section>
        );

      case "attendance":
  return (
    <section className="admin-section">
      <h2>🗓 Attendance Tracking</h2>
      <p>Mark daily or weekly attendance of students for each route.</p>

      <button className="action-btn" onClick={fetchAttendance}>
        View Attendance Summary
      </button>

      <h3>🎯 Mark Attendance</h3>
      <ul>
        {students
          .filter((s) => s.role === "student")
          .map((s) => (
            <li key={s._id}>
              {s.name} ({s.studentId})
              <button
                className="mini-btn"
                onClick={() =>
                  handleMarkAttendance(s.studentId, s.assignedRoute || "N/A")
                }
              >
                Mark Present
              </button>
            </li>
          ))}
      </ul>

      <h3 style={{ marginTop: "1.5rem" }}>📋 Attendance Summary</h3>
      {attendance.length === 0 ? (
        <p>No attendance records available yet.</p>
      ) : (
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Route</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a, i) => (
              <tr key={i}>
                <td>{a.studentId}</td>
                <td>{a.routeName || "N/A"}</td>
                <td>{a.status}</td>
                <td>{new Date(a.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );


      case "alerts":
        return (
          <section className="admin-section">
            <h2>📢 Announcements & Alerts</h2>
            <textarea
              placeholder="Type your announcement or alert..."
              className="announcement-box"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button className="send-btn" onClick={handleSendAlert}>
              Send Alert
            </button>
            <h3>📜 Recent Alerts</h3>
            <ul>
              {alerts.map((a) => (
                <li key={a._id}>
                  {a.message} - {new Date(a.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        );

      default:
        return (
          <section className="admin-section">
            <h2>📊 Overview</h2>
            <p>
              Welcome, <strong>{user?.name || "Admin"}</strong> 👋
            </p>
            <p>
              Use the sidebar to manage routes, drivers, fees, and send
              announcements.
            </p>
          </section>
        );
    }
  };

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-profile">
          <h2>🚍 VignanBusTracker</h2>
          <p>{user?.email}</p>
        </div>
        <nav className="admin-menu">
          {["overview", "routes", "drivers", "fees", "attendance", "alerts"].map(
            (tab) => (
              <button
                key={tab}
                className={
                  activeTab === tab ? "menu-btn active" : "menu-btn"
                }
                onClick={() => setActiveTab(tab)}
              >
                {tab === "overview"
                  ? "Dashboard"
                  : tab === "routes"
                  ? "Routes & Stops"
                  : tab === "drivers"
                  ? "Drivers"
                  : tab === "fees"
                  ? "Fee Collection"
                  : tab === "attendance"
                  ? "Attendance"
                  : "Announcements"}
              </button>
            )
          )}
        </nav>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <main className="admin-main">{renderContent()}</main>
    </div>
  );
}

export default AdminDashboard;
