import React from "react";
import NavBar from "../components/nav/NavBar";
import TodoList from "../components/todolist/TodoList";
import InboxSidebar from "../components/notifications/InboxSidebar";

export default function TodoPage() {
  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main
          className="page-content app-shell-main page-main-padded"
          style={{ maxWidth: "720px", margin: "0 auto" }}
        >
          <TodoList />
        </main>
      </div>
    </div>
  );
}
