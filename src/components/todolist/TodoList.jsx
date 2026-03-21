import React, { useMemo, useState, useEffect } from "react";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

const ITEM_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#0891b2",
  "#9333ea",
  "#dc2626",
  "#0f766e",
  "#d97706",
];

function colorForUserKey(value) {
  const key = String(value ?? "unknown");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ITEM_COLORS[hash % ITEM_COLORS.length];
}

function dueDateTime(item) {
  if (!item?.dueDate) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(item.dueDate);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function compareByNearestDueDate(a, b) {
  const dueDiff = dueDateTime(a) - dueDateTime(b);
  if (dueDiff !== 0) {
    return dueDiff;
  }

  const aCreated = Date.parse(a?.createdAt || "");
  const bCreated = Date.parse(b?.createdAt || "");
  if (
    !Number.isNaN(aCreated) &&
    !Number.isNaN(bCreated) &&
    aCreated !== bCreated
  ) {
    return bCreated - aCreated;
  }

  return String(a?.text ?? "").localeCompare(String(b?.text ?? ""), "pl");
}

export default function TodoList({ title }) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t("todo.title", "To-Do");
  const [localTasks, setLocalTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // ── Load from API on mount ─────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api
      .getTodos()
      .then((data) => setLocalTasks(data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const addTask = (item) => {
    api
      .createTodo({ text: item.text, dueDate: item.dueDate || null })
      .then((created) => setLocalTasks((prev) => [...prev, created]))
      .catch((err) => alert(`Failed to add task: ${err.message}`));
  };

  const toggleTask = (item) => {
    api
      .toggleTodo(item.id)
      .then((updated) =>
        setLocalTasks((prev) =>
          prev.map((task) => (task.id === updated.id ? updated : task)),
        ),
      )
      .catch((err) => alert(`Failed to toggle task: ${err.message}`));
  };

  const deleteTask = (item) => {
    api
      .deleteTodo(item.id)
      .then(() =>
        setLocalTasks((prev) => prev.filter((task) => task.id !== item.id)),
      )
      .catch((err) => alert(`Failed to delete task: ${err.message}`));
  };

  const sortedTasks = useMemo(
    () => [...localTasks].sort(compareByNearestDueDate),
    [localTasks],
  );

  return (
    <div className="card todo-card">
      <div className="card-header">
        <h2>{resolvedTitle}</h2>
        <button
          type="button"
          className="add-list-plus"
          onClick={() => setShowForm((s) => !s)}
          aria-label="Add task"
          title="Add task"
        >
          <span className="plus">+</span>
        </button>
      </div>

      <div className="card-body">
        {showForm && (
          <TodoForm
            onAdd={(it) => {
              addTask(it);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading ? (
          <p>{t("common.loading", "Loading\u2026")}</p>
        ) : error ? (
          <p style={{ color: "red" }}>
            {t("common.error", "Error:")} {error}
          </p>
        ) : localTasks.length === 0 ? (
          <p>{t("todo.empty", "No tasks")}</p>
        ) : (
          <ul className="todo-list">
            {sortedTasks.map((task) => (
              <TodoItem
                key={task.id}
                item={task}
                accentColor={colorForUserKey(task.createdBy ?? task.ownerId)}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
