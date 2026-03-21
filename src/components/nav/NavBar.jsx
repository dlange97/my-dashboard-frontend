import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "../../context/TranslationContext";
import api from "../../api/api";
import "./nav.css";

const NAV_LINKS = [
  {
    to: "/",
    labelKey: "nav.dashboard",
    label: "Dashboard",
    icon: "🏠",
    permission: "dashboard.view",
  },
  {
    to: "/todos",
    labelKey: "nav.todos",
    label: "To-Do",
    icon: "✅",
    permission: "todos.view",
  },
  {
    to: "/shopping",
    labelKey: "nav.shopping",
    label: "Shopping",
    icon: "🛒",
    permission: "shopping.view",
  },
  {
    to: "/events",
    labelKey: "nav.events",
    label: "My Events",
    icon: "📅",
    permission: "events.view",
  },
  {
    to: "/calendar",
    labelKey: "nav.calendar",
    label: "Calendar",
    icon: "🗓️",
    permission: "events.view",
  },
  {
    to: "/map",
    labelKey: "nav.map",
    label: "Map",
    icon: "🗺️",
    permission: "map.view",
  },
  {
    to: "/users",
    labelKey: "nav.users",
    label: "Users",
    icon: "👥",
    permission: "users.view",
  },
  {
    to: "/settings",
    labelKey: "nav.settings",
    label: "Settings",
    icon: "⚙️",
    permission: "settings.view",
  },
];

const SUPPORTED_LOCALES = ["en", "pl"];

export default function NavBar() {
  const { user, logout, hasPermission } = useAuth();
  const { t, locale, changeLocale } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);
  const visibleLinks = NAV_LINKS.filter((link) =>
    hasPermission(link.permission),
  );

  async function handleLocaleChange(newLocale) {
    setLangOpen(false);
    if (newLocale === locale) return;
    changeLocale(newLocale);
    try {
      await api.updateMyLanguage(newLocale);
    } catch {
      // best-effort: local preference already updated
    }
  }

  return (
    <header className="top-nav">
      <div className="nav-brand">
        <span className="nav-brand-icon">📊</span>
        <span className="nav-brand-name">{t("nav.brand", "My Dashboard")}</span>
      </div>

      {/* Desktop links */}
      <nav className="nav-links" aria-label="Main navigation">
        {visibleLinks.map(({ to, labelKey, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
          >
            <span className="nav-link-icon">{icon}</span>
            <span className="nav-link-label">{t(labelKey, label)}</span>
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      <div className="nav-user-area">
        {user && <span className="nav-user-email">{user.email}</span>}

        {/* Language switcher */}
        <div className="nav-lang-switcher" ref={langRef}>
          <button
            className="nav-lang-btn"
            onClick={() => setLangOpen((o) => !o)}
            title={t("nav.changeLanguage", "Change language")}
            aria-label={t("nav.changeLanguage", "Change language")}
            aria-expanded={langOpen}
          >
            🌐 <span className="nav-lang-current">{locale.toUpperCase()}</span>
          </button>
          {langOpen && (
            <div className="nav-lang-dropdown">
              {SUPPORTED_LOCALES.map((loc) => (
                <button
                  key={loc}
                  className={`nav-lang-option${locale === loc ? " active" : ""}`}
                  onClick={() => handleLocaleChange(loc)}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="nav-logout-btn"
          onClick={logout}
          title={t("nav.signOut", "Sign out")}
        >
          {t("nav.signOut", "Sign out")}
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
          {visibleLinks.map(({ to, labelKey, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-mobile-link${isActive ? " active" : ""}`
              }
            >
              {icon} {t(labelKey, label)}
            </NavLink>
          ))}
          {SUPPORTED_LOCALES.filter((loc) => loc !== locale).map((loc) => (
            <button
              key={loc}
              className="nav-mobile-lang"
              onClick={() => handleLocaleChange(loc)}
            >
              🌐 {loc.toUpperCase()}
            </button>
          ))}
          <button className="nav-mobile-logout" onClick={logout}>
            🚪 {t("nav.signOut", "Sign out")}
          </button>
        </nav>
      )}
    </header>
  );
}
