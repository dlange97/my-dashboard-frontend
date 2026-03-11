import React from "react";
import NavBar from "../components/nav/NavBar";
import NewUserForm from "../components/auth/NewUserForm";
import InboxSidebar from "../components/notifications/InboxSidebar";

export default function UserManagementPage() {
  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main">
          <NewUserForm />
        </main>
      </div>
    </div>
  );
}
