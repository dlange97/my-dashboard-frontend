import React, { useState, useEffect } from "react";
import TodoItem from "./TodoItem";
import TodoForm from "./TodoForm";
import api from "../../api/api";

export default function TodoList({ title = "To-Do" }) {
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
      .createTodo({ text: item.text })
      .then((created) => setLocalTasks((prev) => [...prev, created]))
      .catch((err) => alert(`Failed to add task: ${err.message}`));
  };

  const toggleTask = (item) => {
    api
      .toggleTodo(item.id)
      .then((updated) =>
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t)),
        ),
      )
      .catch((err) => alert(`Failed to toggle task: ${err.message}`));
  };

  const deleteTask = (item) => {
    api
      .deleteTodo(item.id)
      .then(() => setLocalTasks((prev) => prev.filter((t) => t.id !== item.id)))
      .catch((err) => alert(`Failed to delete task: ${err.message}`));
  };

  return (
    <div className="card todo-card">
      <div className="card-header">
        <h2>{title}</h2>
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
          <p>Loading&hellip;</p>
        ) : error ? (
          <p style={{ color: "red" }}>Error: {error}</p>
        ) : localTasks.length === 0 ? (
          <p>No tasks</p>
        ) : (
          <ul className="todo-list">
            {localTasks.map((t) => (
              <TodoItem
                key={t.id}
                item={t}
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
