import React, { useState } from "react";
import NavBar from "../components/nav/NavBar";
import AccessSettings from "../components/auth/AccessSettings";
import JwtSessionSettings from "../components/auth/JwtSessionSettings";
import NotificationSettings from "../components/notifications/NotificationSettings";
import TranslationSettings from "../components/translations/TranslationSettings";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";
import "../styles/settings.css";

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState("access");
  const isAdmin =
    Array.isArray(user?.roles) && user.roles.includes("ROLE_ADMIN");

  const sections = [
    {
      id: "access",
      label: t("settings.access", "🔐 Access & Roles"),
      subtitle: t("settings.accessSubtitle", "Manage roles and permissions"),
      component: <AccessSettings />,
    },
    ...(isAdmin
      ? [
          {
            id: "jwt-session",
            label: t("settings.jwtSession", "🪪 JWT Session"),
            subtitle: t(
              "settings.jwtSessionSubtitle",
              "Token expiry configuration",
            ),
            component: <JwtSessionSettings />,
          },
        ]
      : []),
    {
      id: "notifications",
      label: t("settings.notifications", "🔔 Notifications"),
      subtitle: t(
        "settings.notificationsSubtitle",
        "Message templates and delivery channels",
      ),
      component: <NotificationSettings />,
    },
    ...(isAdmin
      ? [
          {
            id: "translations",
            label: t("settings.translations", "🌐 Translations"),
            subtitle: t(
              "settings.translationsSubtitle",
              "Manage UI translation keys",
            ),
            component: <TranslationSettings />,
          },
        ]
      : []),
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
            <h1>⚙️ {t("settings.title", "Settings")}</h1>

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
