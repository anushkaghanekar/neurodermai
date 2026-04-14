import { useState, useEffect, useCallback } from "react";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
import HistoryPage from "./pages/HistoryPage";
import Navbar from "./components/Navbar";
import { getToken, setToken, clearToken, getStoredUser, setStoredUser } from "./lib/auth";

function getPage() {
  const hash = window.location.hash.replace(/^#\/?/, "") || "dashboard";
  if (hash === "auth") return "auth";
  if (hash === "history") return "history";
  return "dashboard";
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPage);
  const [user, setUser] = useState(getStoredUser);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("nd_theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nd_theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  // Listen for hash changes (browser back/forward)
  useEffect(() => {
    function onHashChange() {
      setCurrentPage(getPage());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((page) => {
    window.location.hash = `#/${page}`;
    setCurrentPage(page);
  }, []);

  function handleAuthSuccess(token, userData) {
    setToken(token);
    setStoredUser(userData);
    setUser(userData);
    navigate("dashboard");
  }

  function handleLogout() {
    clearToken();
    setUser(null);
    navigate("dashboard");
  }

  // If user tries to access history without auth, redirect to auth
  useEffect(() => {
    if (currentPage === "history" && !user) {
      navigate("auth");
    }
  }, [currentPage, user, navigate]);

  // If logged-in user navigates to auth, redirect to dashboard
  useEffect(() => {
    if (currentPage === "auth" && user) {
      navigate("dashboard");
    }
  }, [currentPage, user, navigate]);

  return (
    <>
      <Navbar
        user={user}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigate={navigate}
        currentPage={currentPage}
        onLogout={handleLogout}
      />
      <div className="app-shell">
        {currentPage === "dashboard" && <Dashboard user={user} />}
        {currentPage === "auth" && <AuthPage onAuthSuccess={handleAuthSuccess} />}
        {currentPage === "history" && user && <HistoryPage />}
      </div>
    </>
  );
}

export default App;
