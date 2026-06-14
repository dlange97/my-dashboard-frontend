import React, { useState, useCallback } from "react";
import api from "../../api/api";

const SERVICES = ["auth", "dashboard", "events", "notification", "translation"];

export default function SecurityLogSettings() {
  const [selectedService, setSelectedService] = useState("auth");
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(
    async (svc = selectedService, p = page) => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getSecurityLogs(svc, { page: p, perPage: 50 });
        setLogs(data);
      } catch (err) {
        setError(err.message || "Failed to load security logs.");
      } finally {
        setLoading(false);
      }
    },
    [selectedService, page],
  );

  function handleServiceChange(svc) {
    setSelectedService(svc);
    setPage(1);
    setLogs(null);
    setError("");
  }

  async function handleLoad() {
    await load(selectedService, page);
  }

  async function handleClear() {
    if (
      !window.confirm(
        `Clear all rate-limit logs for "${selectedService}"? This cannot be undone.`,
      )
    )
      return;

    setClearing(true);
    setError("");
    try {
      await api.clearSecurityLogs(selectedService);
      setLogs(null);
    } catch (err) {
      setError(err.message || "Failed to clear logs.");
    } finally {
      setClearing(false);
    }
  }

  async function handlePage(newPage) {
    setPage(newPage);
    await load(selectedService, newPage);
  }

  return (
    <div className="security-log-settings">
      <p className="security-log-description">
        Requests blocked by the rate limiter (potential DDoS / brute-force
        attempts) are logged here. Each microservice stores its own log.
      </p>

      <div className="security-log-controls">
        <div className="security-log-service-tabs">
          {SERVICES.map((svc) => (
            <button
              key={svc}
              type="button"
              className={`security-log-tab${selectedService === svc ? " active" : ""}`}
              onClick={() => handleServiceChange(svc)}
            >
              {svc}
            </button>
          ))}
        </div>

        <div className="security-log-actions">
          <button
            type="button"
            className="btn-primary"
            onClick={handleLoad}
            disabled={loading}
          >
            {loading ? "Loading…" : "Load logs"}
          </button>

          {logs && (
            <button
              type="button"
              className="btn-danger"
              onClick={handleClear}
              disabled={clearing}
            >
              {clearing ? "Clearing…" : "Clear logs"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      {logs && (
        <>
          <div className="security-log-summary">
            <span>
              Service: <strong>{logs.service}</strong>
            </span>
            <span>
              Total blocked requests: <strong>{logs.total}</strong>
            </span>
            <span>
              Page {logs.page} / {logs.pages}
            </span>
          </div>

          {logs.items.length === 0 ? (
            <p className="security-log-empty">No blocked requests logged.</p>
          ) : (
            <div className="security-log-table-wrapper">
              <table className="security-log-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>IP</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Sensitive</th>
                    <th>Instance</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.items.map((row) => (
                    <tr
                      key={row.id}
                      className={row.isSensitive ? "row-sensitive" : ""}
                    >
                      <td>{row.id}</td>
                      <td className="cell-mono">{row.ip}</td>
                      <td>
                        <span
                          className={`method-badge method-${row.method.toLowerCase()}`}
                        >
                          {row.method}
                        </span>
                      </td>
                      <td className="cell-path">{row.path}</td>
                      <td className="cell-center">
                        {row.isSensitive ? "⚠️ yes" : "no"}
                      </td>
                      <td className="cell-mono">{row.instanceId ?? "—"}</td>
                      <td className="cell-nowrap">{row.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {logs.pages > 1 && (
            <div className="security-log-pagination">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => handlePage(page - 1)}
              >
                ← Prev
              </button>
              <span>
                {page} / {logs.pages}
              </span>
              <button
                type="button"
                disabled={page >= logs.pages || loading}
                onClick={() => handlePage(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
