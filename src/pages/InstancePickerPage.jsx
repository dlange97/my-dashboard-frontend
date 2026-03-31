import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

export default function InstancePickerPage() {
  const { selectInstance } = useAuth();
  const navigate = useNavigate();

  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMyInstances()
      .then((data) => {
        setInstances(data ?? []);
      })
      .catch(() => {
        setError("Failed to load instances.");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(instance) {
    selectInstance(instance.id);
    navigate("/", { replace: true });
  }

  if (loading) {
    return <div className="app-page-loading">Loading your instances…</div>;
  }

  if (error) {
    return (
      <div className="checkout-page checkout-invalid">
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (instances.length === 0) {
    return (
      <div className="checkout-page checkout-invalid">
        <h1>No Instances</h1>
        <p>
          Your account is not assigned to any instance. Please contact an
          administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <h1 className="checkout-title">Select Instance</h1>
        <p className="checkout-subtitle">
          You have access to multiple instances. Choose one to continue.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          {instances.map((inst) => (
            <button
              key={inst.id}
              className="btn btn-primary"
              style={{ textAlign: "left", padding: "16px 20px" }}
              onClick={() => handleSelect(inst)}
            >
              <strong>{inst.name}</strong>
              <br />
              <small style={{ opacity: 0.7 }}>
                {inst.subdomain}.mydashboard.com
              </small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
