import { useEffect, useState } from "react";
import "./PageStyles.css";

export default function UserInterface({ onNavigate }) {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const [theme, setTheme] = useState("light");
  const toggles = [
    { icon: "📱", title: "Responsive UI", text: "Automatic layouts for phone, tablet and desktop." },
    { icon: "🌙", title: "Dark / Light Themes", text: "Toggle theme to improve readability and battery." },
    { icon: "🔍", title: "Smart Search", text: "Global search across buses, routes and schedules." },
    { icon: "⚡", title: "Fast Interactions", text: "Optimized rendering and snappy responses." }
  ];

  return (
    <main className="info-page" aria-labelledby="ui-heading">
      <h1 id="ui-heading">👤 User-Friendly Interface</h1>
      <p>
        The UI focuses on clarity, speed and accessibility. We minimize clicks and
        surface the most important information with smart defaults.
      </p>

      <section className="info-section fade-in" aria-labelledby="design-heading">
        <h2 id="design-heading">🎨 Design Principles</h2>
        <p>
          Clarity, hierarchy, and consistent spacing guide the layout. Visual affordances
          (icons, badges, and motion) provide context without noise.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
          <button
            className="back-btn"
            onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
            aria-pressed={theme === "dark"}
          >
            Toggle {theme === "light" ? "Dark" : "Light"} Mode
          </button>

          <button className="back-btn" onClick={() => onNavigate("tracker")}>Open Live Tracker</button>
        </div>
      </section>

      <div className="info-image fade-in-delay">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=800&fit=crop"
          alt="Dashboard preview"
          loading="lazy"
        />
      </div>

      <section className="info-section fade-in" aria-labelledby="highlights-heading">
        <h2 id="highlights-heading">🧭 Highlights</h2>

        <div className="feature-grid">
          {toggles.map((t, i) => (
            <div className="feature-card" key={i}>
              <div className="feature-icon">{t.icon}</div>
              <h3>{t.title}</h3>
              <p>{t.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="info-section fade-in" aria-labelledby="ux-heading">
        <h2 id="ux-heading">💡 UX Details</h2>
        <p>
          Microinteractions (button feedback, small transitions) and accessibility (high contrast,
          keyboard navigation) are built-in. We also provide an easy onboarding flow for first-time users.
        </p>

        <ul>
          <li>Keyboard-first navigation</li>
          <li>ARIA labels and accessible contrast</li>
          <li>Minimal visual noise for quick scanning</li>
        </ul>
      </section>

      <button className="back-btn" onClick={() => onNavigate("home")}>← Back to Home</button>
    </main>
  );
}
