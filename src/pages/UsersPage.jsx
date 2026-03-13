import React, { useEffect, useState } from "react";
import NavBar from "../components/nav/NavBar";
import UsersList from "../components/auth/UsersList";
import NewUserForm from "../components/auth/NewUserForm";
import UserProfileCard from "../components/auth/UserProfileCard";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { Button, ConfirmModal } from "../components/ui";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [availableRoles, setAvailableRoles] = useState(["ROLE_USER"]);
  const [userToDelete, setUserToDelete] = useState(null);

  const canCreateUsers = hasPermission("users.create");
  const canEditUsers = hasPermission("users.assign_roles");

  useEffect(() => {
    if (!canEditUsers) return;

    api
      .getAccessSettings()
      .then((data) => {
        if (Array.isArray(data?.roles) && data.roles.length > 0) {
          setAvailableRoles(data.roles);
        }
      })
      .catch(() => {});
  }, [canEditUsers]);

  useEffect(() => {
    if (users.length === 0) {
      setSelectedUser(null);
      setSelectedUserId(null);
      setProfileError("");
      return;
    }

    const nextSelectedUser =
      users.find((user) => user.id === selectedUserId) ?? users[0];

    setSelectedUser(nextSelectedUser);
    if (selectedUserId !== nextSelectedUser.id) {
      setSelectedUserId(nextSelectedUser.id);
    }
  }, [selectedUserId, users]);

  useEffect(() => {
    if (!selectedUserId || !hasPermission("users.view") || isCreateOpen) {
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    setProfileError("");

    api
      .getUserById(selectedUserId)
      .then((user) => {
        if (!cancelled) {
          setSelectedUser(user);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setProfileError(error.message || "Failed to load user profile.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasPermission, isCreateOpen, refreshKey, selectedUserId]);

  function handleUsersChange(nextUsers) {
    setUsers(nextUsers);
  }

  function handleUserSelect(user) {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setProfileError("");
    setIsCreateOpen(false);
    setProfileEditMode(false);
  }

  function handleUserCreated(user) {
    const nextUser = {
      ...user,
      role: user.roles?.[0] ?? "ROLE_USER",
    };

    setSelectedUser(nextUser);
    setSelectedUserId(nextUser.id);
    setIsCreateOpen(false);
    setProfileEditMode(false);
    setRefreshKey((current) => current + 1);
  }

  function handleEditUser(user) {
    setSelectedUser(user);
    setSelectedUserId(user.id);
    setIsCreateOpen(false);
    setProfileError("");
    setProfileEditMode(true);
  }

  async function handleSaveUser(userId, payload) {
    const data = await api.updateUser(userId, payload);
    const updated = data?.user ?? null;
    if (updated) {
      setSelectedUser(updated);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === updated.id ? { ...user, ...updated } : user,
        ),
      );
    }
    setProfileEditMode(false);
    setRefreshKey((current) => current + 1);
  }

  async function handleConfirmDeleteUser() {
    if (!userToDelete) return;

    await api.deleteUser(userToDelete.id);
    setUserToDelete(null);
    setProfileEditMode(false);

    if (selectedUserId === userToDelete.id) {
      setSelectedUser(null);
      setSelectedUserId(null);
    }

    setRefreshKey((current) => current + 1);
  }

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main">
          <section className="auth-users-page">
            <div className="auth-users-page-header">
              <div>
                <p className="auth-users-page-kicker">User management</p>
                <h1>Users</h1>
                <p className="auth-users-page-subtitle">
                  Browse team accounts, inspect profile details, and open the
                  new user form only when you need it.
                </p>
              </div>

              {canCreateUsers && (
                <Button
                  onClick={() => setIsCreateOpen((current) => !current)}
                  variant={isCreateOpen ? "secondary" : "primary"}
                >
                  {isCreateOpen ? "Close form" : "Add user"}
                </Button>
              )}
            </div>

            <div className="auth-users-layout">
              {hasPermission("users.view") && (
                <UsersList
                  onSelectUser={handleUserSelect}
                  onUsersChange={handleUsersChange}
                  onEditUser={handleEditUser}
                  onDeleteUser={setUserToDelete}
                  refreshKey={refreshKey}
                  selectedUserId={selectedUserId}
                />
              )}

              <div className="auth-users-sidebar">
                {isCreateOpen && canCreateUsers ? (
                  <NewUserForm
                    onCancel={() => setIsCreateOpen(false)}
                    onCreated={handleUserCreated}
                  />
                ) : (
                  <UserProfileCard
                    user={selectedUser}
                    loading={profileLoading}
                    error={profileError}
                    canEdit={canEditUsers}
                    editMode={profileEditMode}
                    availableRoles={availableRoles}
                    onCancelEdit={() => setProfileEditMode(false)}
                    onSave={handleSaveUser}
                  />
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      {userToDelete && (
        <ConfirmModal
          title="Deactivate user?"
          message={`User ${userToDelete.email} will be soft deleted and marked as inactive.`}
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}
    </div>
  );
}
