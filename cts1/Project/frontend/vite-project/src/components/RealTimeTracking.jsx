import { useEffect, useState } from "react";
import "./PageStyles.css";

export default function RealTimeTracking({ onNavigate }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [copied, setCopied] = useState(false);
  const [openFAQ, setOpenFAQ] = useState(null);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const faqs = [
    { q: "How often is location data updated?", a: "Location updates occur every 5–15 seconds depending on device connectivity and backend configuration." },
    { q: "Can I track multiple buses at once?", a: "Yes — the Live Tracker lets you select multiple buses and watch them on the same map." },
    { q: "What if GPS signal is lost?", a: "We estimate location using last known coordinates and speed; alerts are raised for long signal loss." }
  ];

  return (
    <main className="info-page" aria-labelledby="rt-heading">
      <h1 id="rt-heading">⏱️ Real-Time Bus Tracking</h1>
      <p>
        Real-time tracking helps students and staff reduce waiting time, plan smarter,
        and travel with confidence. See live bus positions, estimated arrival times,
        and route progress on an interactive map.
      </p>

      <section className="info-section fade-in" aria-labelledby="what-heading">
        <h2 id="what-heading">📍 What this does</h2>
        <p>
          Our system connects GPS devices installed on buses to a cloud backend. The frontend
          displays live positions, ETAs and route telemetry so you always know where your bus is.
        </p>

        <ul>
          <li>Live position & heading</li>
          <li>ETA to your stop and to the final destination</li>
          <li>Driver & vehicle info at a glance</li>
          <li>Lightweight mobile UI for fast access on the go</li>
        </ul>

        <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <button className="back-btn" onClick={() => onNavigate("tracker")} aria-label="Open Live Tracker">
            Open Live Tracker
          </button>

          <button
            onClick={handleCopyLink}
            className="back-btn"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
            aria-live="polite"
          >
            {copied ? "Link Copied ✓" : "Copy Page Link"}
          </button>

          <button
            onClick={() => { window.print(); }}
            className="back-btn"
            style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)" }}
            aria-label="Print this page"
          >
            Print / Save
          </button>
        </div>
      </section>

      <div className="info-image fade-in-delay" role="img" aria-label="Map illustration">
        <img
          src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&h=800&fit=crop"
          alt="Illustration of a map with tracked vehicles"
          loading="lazy"
        />
      </div>

      <section className="info-section fade-in" aria-labelledby="how-heading">
        <h2 id="how-heading">🚍 How It Works — quick technical overview</h2>
        <p>
          Buses send GPS coordinates to the backend; the server validates and publishes them
          via REST or WebSocket to clients. The frontend maps these points and calculates ETAs.
        </p>

        <div className="feature-grid" aria-hidden="false">
          <div className="feature-card">
            <div className="feature-icon">🛰️</div>
            <h3>GPS & Telematics</h3>
            <p>Reliable tracking modules with fallback heuristics for temporary signal loss.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Realtime Delivery</h3>
            <p>Socket-based updates or frequent polling for low-latency UX.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Interactive Map</h3>
            <p>Lat/Lng markers, custom icons, and route polylines for full clarity.</p>
          </div>
        </div>
      </section>

      <section className="info-section fade-in" aria-labelledby="faq-heading">
        <h2 id="faq-heading">❓ Frequently asked</h2>

        <div>
          {faqs.map((f, i) => (
            <details
              key={i}
              open={openFAQ === i}
              onToggle={(e) => setOpenFAQ(e.target.open ? i : null)}
              style={{ marginBottom: 12 }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>{f.q}</summary>
              <p style={{ marginTop: 8 }}>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <button className="back-btn" onClick={() => onNavigate("home")}>← Back to Home</button>
    </main>
  );
}
