import { useState } from "react";
import { Scan, ClipboardList, MapPin, Sun, Moon, BrainCircuit, LogOut, User } from "lucide-react";

export default function Navbar({ user, theme, onToggleTheme, onNavigate, currentPage, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleNav(page) {
    onNavigate(page);
    setMenuOpen(false);
  }

  return (
    <nav className="navbar">
      {/* SVG Gradient Definition for Logo */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => handleNav("dashboard")}>
          <span className="navbar-logo-container">
            <BrainCircuit size={28} className="navbar-logo-icon" />
            <div className="navbar-logo-glow"></div>
          </span>
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
            className={`nav-link flex items-center gap-2 ${currentPage === "dashboard" ? "nav-active" : ""}`}
            onClick={() => handleNav("dashboard")}
          >
            <Scan size={18} /> Scan
          </button>

          {user && (
            <button 
              className={`nav-link flex items-center gap-2 ${currentPage === "history" ? "nav-active" : ""}`}
              onClick={() => handleNav("history")}
            >
              <ClipboardList size={18} /> History
            </button>
          )}

          <button 
            className={`nav-link flex items-center gap-2 ${currentPage === "clinics" ? "nav-active" : ""}`}
            onClick={() => handleNav("clinics")}
          >
            <MapPin size={18} /> Clinics
          </button>

          <button 
            className="nav-link theme-btn flex items-center justify-center"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <div className="nav-user-section flex items-center gap-3">
              <span className="nav-user-name flex items-center gap-2"><User size={16} /> {user.name}</span>
              <button className="nav-link nav-logout flex items-center gap-2" onClick={onLogout}>
                <LogOut size={16} /> Logout
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
