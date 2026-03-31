import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../context/TranslationContext";
import "./not-found.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */

function NotFoundIcon() {
  return (
    <svg className="nf-icon" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* Magnifying glass lens */}
      <circle
        cx="33"
        cy="33"
        r="20"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Handle */}
      <line
        x1="48"
        y1="48"
        x2="68"
        y2="68"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* X mark inside the lens — nothing found */}
      <line
        x1="24"
        y1="24"
        x2="42"
        y2="42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      <line
        x1="42"
        y1="24"
        x2="24"
        y2="42"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
}

function ForbiddenIcon() {
  return (
    <svg className="nf-icon" viewBox="0 0 80 80" fill="none" aria-hidden="true">
      {/* Lock body */}
      <rect
        x="14"
        y="38"
        width="52"
        height="32"
        rx="7"
        stroke="currentColor"
        strokeWidth="4"
      />
      {/* Shackle — legs enter lock body at y=44, arch peaks at y=18 */}
      <path
        d="M26 44V28a14 12 0 0 0 28 0V44"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Keyhole circle */}
      <circle cx="40" cy="52" r="5" stroke="currentColor" strokeWidth="3.5" />
      {/* Keyhole slot */}
      <line
        x1="40"
        y1="57"
        x2="40"
        y2="63"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      className="nf-btn-arrow"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 8H2M2 8l5-5M2 8l5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Component ─────────────────────────────────────────────────────────── */

/**
 * Unified error page for both unknown routes (404) and permission-denied (403).
 * @param {"notfound"|"forbidden"} type
 */
export default function NotFoundPage({ type = "notfound" }) {
  const { t } = useTranslation();
  const isForbidden = type === "forbidden";

  return (
    <div className="nf-page">
      <div className="nf-card">
        <div className="nf-icon-wrap">
          {isForbidden ? <ForbiddenIcon /> : <NotFoundIcon />}
        </div>

        <div className="nf-code">{isForbidden ? "403" : "404"}</div>

        <h1 className="nf-title">
          {isForbidden
            ? t("error.forbidden.title", "Access Restricted")
            : t("error.notFound.title", "Page Not Found")}
        </h1>

        <p className="nf-message">
          {isForbidden
            ? t(
                "error.forbidden.message",
                "You don't have permission to view this page. Contact an administrator if you think this is a mistake.",
              )
            : t(
                "error.notFound.message",
                "The page you're looking for doesn't exist or has been moved.",
              )}
        </p>

        <Link to="/" className="nf-btn">
          <ArrowLeftIcon />
          {t("error.backToDashboard", "Back to Dashboard")}
        </Link>
      </div>
    </div>
  );
}
