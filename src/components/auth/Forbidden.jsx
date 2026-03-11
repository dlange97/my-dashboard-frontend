import React from "react";
import { Link } from "react-router-dom";
import "./auth.css";

export default function Forbidden() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Access Denied</h2>
        <p className="auth-subtitle">
          You do not have permission to open this feature.
        </p>
        <p className="auth-footer">
          <Link to="/">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
