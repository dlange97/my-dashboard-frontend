import React, { useState } from "react";
import NavBar from "../components/nav/NavBar";
import AccessSettings from "../components/auth/AccessSettings";
import JwtSessionSettings from "../components/auth/JwtSessionSettings";
import NotificationSettings from "../components/notifications/NotificationSettings";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { useAuth } from "../context/AuthContext";
import "../styles/settings.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState("access");
  const isAdmin =
    Array.isArray(user?.roles) && user.roles.includes("ROLE_ADMIN");

  const sections = [
    {
      id: "access",
      label: "🔐 Dostęp i Role",
      subtitle: "Zarządzaj rolami i uprawnieniami",
      component: <AccessSettings />,
    },
    ...(isAdmin
      ? [
          {
            id: "jwt-session",
            label: "🪪 Sesja JWT",
            subtitle: "Konfiguracja czasu ważności tokenu",
            component: <JwtSessionSettings />,
          },
        ]
      : []),
    {
      id: "notifications",
      label: "🔔 Powiadomienia",
      subtitle: "Szablony wiadomości i kanały dostarczania",
      component: <NotificationSettings />,
    },
  ];

  function toggle(id) {
    setOpenSection((prev) => (prev === id ? null : id));
  }

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main">
          <div className="settings-page">
            <h1>⚙️ Ustawienia</h1>

            <div className="settings-sections">
              {sections.map((section) => {
                const isOpen = openSection === section.id;
                return (
                  <div
                    key={section.id}
                    className={`settings-section${isOpen ? " open" : ""}`}
                  >
                    <button
                      className="settings-section-header"
                      onClick={() => toggle(section.id)}
                      aria-expanded={isOpen}
                    >
                      <span>
                        {section.label}
                        {section.subtitle && (
                          <span
                            style={{
                              fontWeight: 400,
                              fontSize: "0.82rem",
                              color: "#64748b",
                              marginLeft: 10,
                            }}
                          >
                            {section.subtitle}
                          </span>
                        )}
                      </span>
                      <span className="settings-section-arrow">▼</span>
                    </button>

                    {isOpen && (
                      <div className="settings-section-body">
                        {section.component}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
