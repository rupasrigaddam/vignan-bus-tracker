import { useEffect, useState } from "react";
import "./PageStyles.css";

export default function SafetyFeatures({ onNavigate }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [subscribed, setSubscribed] = useState(false);
  const [openItem, setOpenItem] = useState(null);

  const safetyItems = [
    { title: "Geo-fencing & route verification", desc: "Digital route boundaries ensure the vehicle remains on pre-approved roads; deviation triggers alerts." },
    { title: "Emergency SOS & escalation", desc: "One-touch alerts escalate to campus security and pre-configured contacts with bus details and location." },
    { title: "Driver authentication & logs", desc: "Driver sign-in is validated and recorded; only verified drivers start a route." },
    { title: "Real-time notifications", desc: "Parents, students and admins receive push or SMS updates about arrivals and incidents." }
  ];

  return (
    <main className="info-page" aria-labelledby="sf-heading">
      <h1 id="sf-heading">🔒 Safety & Security Features</h1>
      <p>
        Safety is central to our design. We combine monitoring, quick escalation, and verification
        to reduce risk and increase trust for students, parents, and university staff.
      </p>

      <section className="info-section fade-in" aria-labelledby="why-heading">
        <h2 id="why-heading">🛡️ Why this matters</h2>
        <p>
          Transparent monitoring and automated alerts reduce response time and provide
          clear audit trails for every trip.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
          <button className="back-btn" onClick={() => onNavigate("tracker")}>Open Live Tracker</button>
          <button
            className="back-btn"
            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
            onClick={() => setSubscribed(true)}
            aria-pressed={subscribed}
          >
            {subscribed ? "Subscribed ✓" : "Subscribe for Alerts"}
          </button>
        </div>
      </section>

      <div className="info-image fade-in-delay">
        <img
          src="https://images.unsplash.com/photo-1521790365206-7625a0b0e9f6?w=1200&h=800&fit=crop"
          alt="Security monitoring"
          loading="lazy"
        />
      </div>

      <section className="info-section fade-in" aria-labelledby="core-heading">
        <h2 id="core-heading">🧩 Core safety components</h2>

        <div className="feature-grid">
          {safetyItems.map((s, idx) => (
            <div className="feature-card" key={idx}>
              <div className="feature-icon">{["📡","🚨","🧾","🔔"][idx]}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontWeight: 600 }}>How it operates</summary>
                <p style={{ marginTop: 8 }}>
                  When triggered the system logs the event, notifies administrators, and provides an action checklist.
                </p>
              </details>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section fade-in" aria-labelledby="policy-heading">
        <h2 id="policy-heading">🔐 Privacy & policies</h2>
        <p>
          Location data is retained per university policy and GDPR-like standards can be applied.
          Access is role-based — only authorized personnel and authenticated users can view sensitive data.
        </p>
      </section>

      <button className="back-btn" onClick={() => onNavigate("home")}>← Back to Home</button>
    </main>
  );
}
