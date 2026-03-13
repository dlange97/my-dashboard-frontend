import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/api";

const DEFAULT_DAYS = 30;

function toDaysInput(ttlSeconds) {
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    return String(DEFAULT_DAYS);
  }

  return String(Math.max(1, Math.round(ttlSeconds / 86400)));
}

export default function JwtSessionSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("Default JWT Session");
  const [newDays, setNewDays] = useState(String(DEFAULT_DAYS));
  const [editById, setEditById] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getJwtSessionSettings();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setEditById(
        list.reduce((acc, item) => {
          acc[item.id] = {
            name: item.name ?? "",
            ttlDays: toDaysInput(item.ttlSeconds),
          };

          return acc;
        }, {}),
      );
    } catch (err) {
      setError(err.message || "Nie udało się załadować ustawień JWT.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate() {
    const ttlDays = Number(newDays);
    if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
      setError("Podaj poprawną liczbę dni.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.createJwtSessionSetting({
        name: newName.trim() || "Default JWT Session",
        ttlDays,
      });
      setNewDays(String(DEFAULT_DAYS));
      await load();
    } catch (err) {
      setError(err.message || "Nie udało się utworzyć ustawienia.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(id) {
    const current = editById[id];
    const ttlDays = Number(current?.ttlDays);
    if (!Number.isFinite(ttlDays) || ttlDays <= 0) {
      setError("Podaj poprawną liczbę dni.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.updateJwtSessionSetting(id, {
        name: (current?.name ?? "").trim() || "Default JWT Session",
        ttlDays,
      });
      await load();
    } catch (err) {
      setError(err.message || "Nie udało się zapisać zmian.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Usunąć to ustawienie JWT?")) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.deleteJwtSessionSetting(id);
      await load();
    } catch (err) {
      setError(err.message || "Nie udało się usunąć ustawienia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="jwt-session-settings">
      <div className="jwt-session-header">
        <h3>Sesja JWT (tylko admin)</h3>
        <p>Zmiana wpływa na nowe tokeny po kolejnym logowaniu użytkownika.</p>
      </div>

      {error && <div className="jwt-session-error">{error}</div>}

      <div className="jwt-session-create">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nazwa ustawienia"
          disabled={saving}
        />
        <input
          type="number"
          min="1"
          value={newDays}
          onChange={(e) => setNewDays(e.target.value)}
          placeholder="Dni"
          disabled={saving}
        />
        <button type="button" onClick={handleCreate} disabled={saving}>
          Dodaj
        </button>
      </div>

      {loading ? (
        <p className="jwt-session-loading">Ładowanie…</p>
      ) : (
        <div className="jwt-session-table-wrap">
          <table className="jwt-session-table">
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Czas sesji (dni)</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="jwt-session-empty">
                    Brak ustawień. Dodaj pierwszą konfigurację.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={editById[item.id]?.name ?? ""}
                        onChange={(e) =>
                          setEditById((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...(prev[item.id] ?? {}),
                              name: e.target.value,
                            },
                          }))
                        }
                        disabled={saving}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={editById[item.id]?.ttlDays ?? ""}
                        onChange={(e) =>
                          setEditById((prev) => ({
                            ...prev,
                            [item.id]: {
                              ...(prev[item.id] ?? {}),
                              ttlDays: e.target.value,
                            },
                          }))
                        }
                        disabled={saving}
                      />
                    </td>
                    <td className="jwt-session-actions">
                      <button
                        type="button"
                        onClick={() => handleUpdate(item.id)}
                        disabled={saving}
                      >
                        Zapisz
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDelete(item.id)}
                        disabled={saving}
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
