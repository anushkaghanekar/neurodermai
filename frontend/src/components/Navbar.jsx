import { useState } from "react";

export default function Navbar({ user, theme, onToggleTheme, onNavigate, currentPage, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNav(page) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => handleNav("dashboard")}>
          <span className="navbar-logo">◆</span>
          <span className="navbar-title">NeuroDermAI</span>
        </button>

        <button 
          className="navbar-hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${menuOpen ? "open" : ""}`} />
        </button>

        <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
          <button 
            className={`nav-link ${currentPage === "dashboard" ? "nav-active" : ""}`}
            onClick={() => handleNav("dashboard")}
          >
            🔬 Scan
          </button>

          {user && (
            <button 
              className={`nav-link ${currentPage === "history" ? "nav-active" : ""}`}
              onClick={() => handleNav("history")}
            >
              📋 History
            </button>
          )}

          <button 
            className="nav-link theme-btn"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div className="nav-user-section">
              <span className="nav-user-name">{user.name}</span>
              <button className="nav-link nav-logout" onClick={onLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button 
              className={`nav-link nav-auth-btn ${currentPage === "auth" ? "nav-active" : ""}`}
              onClick={() => handleNav("auth")}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
