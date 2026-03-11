import React from "react";
import NavBar from "../components/nav/NavBar";
import UsersList from "../components/auth/UsersList";
import NewUserForm from "../components/auth/NewUserForm";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const { hasPermission } = useAuth();

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main">
          {hasPermission("users.view") && <UsersList />}
          {hasPermission("users.create") && <NewUserForm />}
        </main>
      </div>
    </div>
  );
}
