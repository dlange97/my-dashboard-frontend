import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "../ui/ConfirmModal";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

export default function TodoSummary() {
  const { t } = useTranslation();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmTodo, setConfirmTodo] = useState(null);

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

  const handleConfirmToggle = async () => {
    if (!confirmTodo?.id) {
      setConfirmTodo(null);
      return;
    }

    try {
      const updated = await api.toggleTodo(confirmTodo.id);
      setTodos((prev) =>
        (prev || []).map((todo) => (todo.id === updated.id ? updated : todo)),
      );
    } catch (err) {
      alert(`Failed to update task: ${err.message}`);
    } finally {
      setConfirmTodo(null);
    }
  };

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-todo">✅</span>
          {t("todo.title", "To-Do List")}
        </div>
        <Link to="/todos" className="summary-go-link">
          {t("common.viewAll", "View all")} →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : total === 0 ? (
        <div className="empty-state">{t("todo.empty", "No tasks yet.")}</div>
      ) : (
        <>
          <ul className="todo-summary-list">
            {shown.map((todo) => (
              <li
                key={todo.id}
                className={`todo-summary-item${todo.done ? " done" : ""}`}
              >
                <button
                  type="button"
                  className="todo-summary-link"
                  onClick={() => setConfirmTodo(todo)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <span
                    className={`todo-check${todo.done ? " checked" : ""}`}
                  />
                  <span
                    className={`todo-summary-text${todo.done ? " done" : ""}`}
                  >
                    {todo.text}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <div className="summary-stat">
            {done}/{total} {t("common.completed", "completed")}
            {total > 4 && ` · +${total - 4} ${t("common.more", "more")}`}
          </div>
        </>
      )}

      {confirmTodo && (
        <ConfirmModal
          title={
            confirmTodo.done
              ? t("todo.confirmUndoneTitle", "Mark task as not completed?")
              : t("todo.confirmToggleTitle", "Mark task as completed?")
          }
          message={`"${confirmTodo.text}"`}
          confirmLabel={
            confirmTodo.done
              ? t("todo.markUndone", "Mark as active")
              : t("todo.markDone", "Mark as done")
          }
          cancelLabel={t("common.cancel", "Cancel")}
          onConfirm={handleConfirmToggle}
          onCancel={() => setConfirmTodo(null)}
        />
      )}
    </div>
  );
}
