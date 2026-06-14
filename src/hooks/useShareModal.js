import { useState, useEffect } from "react";
import api from "../api/api";

/**
 * Encapsulates the "share with user" modal pattern used across multiple pages.
 *
 * Usage:
 *   const { shareTarget, shareSearch, shareUsers, shareUsersLoading,
 *           openShareModal, closeShareModal, setShareSearch } = useShareModal();
 *
 *   // open: openShareModal(item)
 *   // close: closeShareModal()
 *   // wire to <ShareUserModal> props directly
 */
export function useShareModal() {
  const [shareTarget, setShareTarget] = useState(null);
  const [shareSearch, setShareSearch] = useState("");
  const [shareUsers, setShareUsers] = useState([]);
  const [shareUsersLoading, setShareUsersLoading] = useState(false);

  useEffect(() => {
    if (!shareTarget) return;

    let cancelled = false;
    setShareUsersLoading(true);

    api
      .getShareableUsers({ page: 1, perPage: 50, search: shareSearch })
      .then((response) => {
        if (cancelled) return;
        const users = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        setShareUsers(users);
      })
      .catch(() => {
        if (!cancelled) setShareUsers([]);
      })
      .finally(() => {
        if (!cancelled) setShareUsersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shareTarget, shareSearch]);

  const openShareModal = (target) => setShareTarget(target);

  const closeShareModal = () => {
    setShareTarget(null);
    setShareSearch("");
    setShareUsers([]);
  };

  return {
    shareTarget,
    shareSearch,
    shareUsers,
    shareUsersLoading,
    openShareModal,
    closeShareModal,
    setShareSearch,
  };
}
