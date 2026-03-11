import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./nav.css";

const NAV_LINKS = [
  { to: "/", label: "Dashboard", icon: "🏠", permission: "dashboard.view" },
  { to: "/todos", label: "To-Do", icon: "✅", permission: "todos.view" },
  {
    to: "/shopping",
    label: "Shopping",
    icon: "🛒",
    permission: "shopping.view",
  },
  { to: "/events", label: "My Events", icon: "📅", permission: "events.view" },
  { to: "/map", label: "Map", icon: "🗺️", permission: "map.view" },
  { to: "/users", label: "Users", icon: "👥", permission: "users.view" },
  {
    to: "/settings",
    label: "Settings",
    icon: "⚙️",
    permission: "settings.view",
  },
];

export default function NavBar() {
  const { user, logout, hasPermission } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const visibleLinks = NAV_LINKS.filter((link) =>
    hasPermission(link.permission),
  );

  return (
    <header className="top-nav">
      <div className="nav-brand">
        <span className="nav-brand-icon">📊</span>
        <span className="nav-brand-name">My Dashboard</span>
      </div>

      {/* Desktop links */}
      <nav className="nav-links" aria-label="Main navigation">
        {visibleLinks.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-link-icon">{icon}</span>
            <span className="nav-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      <div className="nav-user-area">
        {user && <span className="nav-user-email">{user.email}</span>}

        <button className="nav-logout-btn" onClick={logout} title="Sign out">
          Sign out
        </button>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="nav-mobile-menu" onClick={() => setMenuOpen(false)}>
          {visibleLinks.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-mobile-link${isActive ? " active" : ""}`
              }
            >
              {icon} {label}
            </NavLink>
          ))}
          <button className="nav-mobile-logout" onClick={logout}>
            🚪 Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
