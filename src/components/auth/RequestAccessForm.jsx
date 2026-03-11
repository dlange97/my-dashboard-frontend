import React, { useState } from "react";
import api from "../../api/api";
import "./auth.css";

export default function RequestAccessForm({ email, onClose }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequestAccess(e) {
    e.preventDefault();
    setError("");
    setRequestSuccess("");
    if (!email.trim()) {
      setError("Enter your email before sending request access.");
      return;
    }
    setLoading(true);
    try {
      await api.requestAccess({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        message: requestMessage.trim(),
      });
      setRequestSuccess("Request access sent. Admin will review your request.");
      setFirstName("");
      setLastName("");
      setRequestMessage("");
    } catch (err) {
      setError(err.message || "Failed to send request access.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-request-modal">
      <div className="auth-request-modal-content">
        <button className="auth-request-close" onClick={onClose}>
          &times;
        </button>
        <h3>Request Access</h3>
        <form onSubmit={handleRequestAccess}>
          {error && <div className="auth-error">{error}</div>}
          {requestSuccess && (
            <div className="auth-success">{requestSuccess}</div>
          )}
          <div className="form-group">
            <label htmlFor="firstName">First name (optional)</label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last name (optional)</label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="requestMessage">Message</label>
            <textarea
              id="requestMessage"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
          </div>
          <button
            className="auth-btn auth-btn-secondary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending…" : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
}
