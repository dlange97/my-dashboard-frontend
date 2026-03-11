import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";

export default function TodoSummary() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getTodos()
      .then(setTodos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done = todos.filter((t) => t.done).length;
  const total = todos.length;
  const shown = todos.slice(0, 4);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-todo">✅</span>
          To-Do List
        </div>
        <Link to="/todos" className="summary-go-link">
          View all →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : total === 0 ? (
        <div className="empty-state">No tasks yet.</div>
      ) : (
        <>
          <ul className="todo-summary-list">
            {shown.map((t) => (
              <li
                key={t.id}
                className={`todo-summary-item${t.done ? " done" : ""}`}
              >
                <Link to="/todos" className="todo-summary-link">
                  <span className={`todo-check${t.done ? " checked" : ""}`} />
                  <span className={`todo-summary-text${t.done ? " done" : ""}`}>
                    {t.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="summary-stat">
            {done}/{total} completed
            {total > 4 && ` · +${total - 4} more`}
          </div>
        </>
      )}
    </div>
  );
}
