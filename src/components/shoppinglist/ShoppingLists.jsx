import React, { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import NewShoppingList from "./NewShoppingList";
import ConfirmModal from "../ui/ConfirmModal";
import ShareUserModal from "../ui/ShareUserModal";
import Pagination from "../ui/Pagination";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";

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

function dueDateTime(value) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
}

function compareByNearestDueDate(a, b) {
  const dueDiff = dueDateTime(a?.dueDate) - dueDateTime(b?.dueDate);
  if (dueDiff !== 0) {
    return dueDiff;
  }

  const aUpdated = Date.parse(a?.updatedAt || "");
  const bUpdated = Date.parse(b?.updatedAt || "");
  if (
    !Number.isNaN(aUpdated) &&
    !Number.isNaN(bUpdated) &&
    aUpdated !== bUpdated
  ) {
    return bUpdated - aUpdated;
  }

  return String(a?.name ?? "").localeCompare(String(b?.name ?? ""), "pl");
}

function parseDateLocal(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(
    parseInt(m[1], 10),
    parseInt(m[2], 10) - 1,
    parseInt(m[3], 10),
  );
}

function formatDueDate(value) {
  const d = parseDateLocal(value);
  if (!d) return null;
  return d.toLocaleDateString("pl-PL");
}

function getDueDateStatus(value) {
  const due = parseDateLocal(value);
  if (!due) return null;
  const today = new Date();
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (due.getTime() < todayDay.getTime()) return "overdue";
  if (due.getTime() === todayDay.getTime()) return "today";
  return null;
}

export default function ShoppingLists({
  onSelectionChange,
  initialSelectedListId = null,
}) {
  const PAGE_SIZE = 5;
  const { user } = useAuth();
  const [localLists, setLocalLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [viewClosing, setViewClosing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [shareTarget, setShareTarget] = useState(null);
  const [shareSearch, setShareSearch] = useState("");
  const [shareUsers, setShareUsers] = useState([]);
  const [shareUsersLoading, setShareUsersLoading] = useState(false);
  const ANIM_MS = 360;
  const { t } = useTranslation();

  useEffect(() => {
    setLoading(true);
    api
      .getLists()
      .then((data) => {
        const lists = data ?? [];
        setLocalLists(lists);

        if (initialSelectedListId) {
          const preselectIndex = lists.findIndex(
            (list) => String(list.id) === String(initialSelectedListId),
          );
          if (preselectIndex >= 0) {
            setSelectedIndex(preselectIndex);
            setEditingList(JSON.parse(JSON.stringify(lists[preselectIndex])));
            setIsDirty(false);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [initialSelectedListId]);

  useEffect(() => {
    if (typeof onSelectionChange === "function") {
      onSelectionChange(selectedIndex !== null);
    }
  }, [selectedIndex, onSelectionChange]);

  useEffect(() => {
    if (!shareTarget) {
      return;
    }

    setShareUsersLoading(true);
    api
      .getShareableUsers({ page: 1, perPage: 50, search: shareSearch })
      .then((response) => {
        const users = Array.isArray(response)
          ? response
          : Array.isArray(response?.items)
            ? response.items
            : [];
        setShareUsers(users);
      })
      .catch((err) => {
        alert(`Failed to load users: ${err.message}`);
        setShareUsers([]);
      })
      .finally(() => setShareUsersLoading(false));
  }, [shareTarget, shareSearch]);

  const closeShareModal = () => {
    setShareTarget(null);
    setShareSearch("");
    setShareUsers([]);
  };

  const openShareModal = (list) => {
    if (!list) {
      return;
    }
    setShareTarget(list);
  };

  const handleShareList = async (selectedUser) => {
    if (!shareTarget?.id || !selectedUser?.id) {
      return;
    }

    try {
      const updated = await api.shareList(shareTarget.id, selectedUser.id);
      setLocalLists((prev) =>
        prev.map((list) => (list.id === updated.id ? updated : list)),
      );
      if (editingList?.id === updated.id) {
        setEditingList(JSON.parse(JSON.stringify(updated)));
      }
      closeShareModal();
    } catch (err) {
      alert(`Failed to share list: ${err.message}`);
    }
  };

  const isProductBought = (product) => Boolean(product?.bought);

  const isListBought = (products = []) => {
    if (!products.length) return false;
    return products.every((product) => isProductBought(product));
  };

  const updateListField = (index, field, value) => {
    if (selectedIndex !== null && editingList) {
      setEditingList((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);
      return;
    }

    setLocalLists((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const updateProductField = (listIndex, prodIndex, field, value) => {
    if (selectedIndex !== null && editingList) {
      setEditingList((prev) => {
        const products = (prev.products || []).map((product, index) =>
          index === prodIndex ? { ...product, [field]: value } : product,
        );
        return { ...prev, products };
      });
      setIsDirty(true);
      return;
    }

    setLocalLists((prev) => {
      const copy = [...prev];
      const products = (copy[listIndex].products || []).map((product, index) =>
        index === prodIndex ? { ...product, [field]: value } : product,
      );
      copy[listIndex] = { ...copy[listIndex], products };
      return copy;
    });
  };

  const setProductBought = (prodIndex, bought) => {
    if (selectedIndex === null || !editingList) return;
    updateProductField(selectedIndex, prodIndex, "bought", Boolean(bought));
  };

  const setAllProductsBought = (bought) => {
    if (selectedIndex === null || !editingList) return;
    setEditingList((prev) => ({
      ...prev,
      products: (prev.products || []).map((product) => ({
        ...product,
        bought: Boolean(bought),
      })),
    }));
    setIsDirty(true);
  };

  const removeProduct = (listIndex, prodIndex) => {
    if (selectedIndex !== null && editingList) {
      setEditingList((prev) => ({
        ...prev,
        products: (prev.products || []).filter(
          (_, index) => index !== prodIndex,
        ),
      }));
      setIsDirty(true);
      return;
    }

    setLocalLists((prev) => {
      const copy = [...prev];
      copy[listIndex] = {
        ...copy[listIndex],
        products: (copy[listIndex].products || []).filter(
          (_, index) => index !== prodIndex,
        ),
      };
      return copy;
    });
  };

  const addProduct = (listIndex, product) => {
    if (!product || !product.name) return;

    const productToAdd = { ...product, bought: Boolean(product.bought) };

    if (selectedIndex !== null && editingList && selectedIndex === listIndex) {
      setEditingList((prev) => ({
        ...prev,
        products: [...(prev.products || []), productToAdd],
      }));
      setIsDirty(true);
      return;
    }

    setLocalLists((prev) => {
      const copy = [...prev];
      copy[listIndex] = {
        ...copy[listIndex],
        products: [...(copy[listIndex].products || []), productToAdd],
      };
      return copy;
    });
  };

  const removeList = (index) => {
    const list = localLists[index];
    api
      .deleteList(list.id)
      .then(() => {
        setLocalLists((prev) => prev.filter((_, i) => i !== index));
        setSelectedIndex(null);
        setEditingList(null);
        setIsDirty(false);
      })
      .catch((err) => alert(`Failed to delete list: ${err.message}`));
  };

  const closeEditor = () => {
    setSelectedIndex(null);
    setEditingList(null);
    setIsDirty(false);
  };

  const handleSelect = (index) => {
    setViewClosing(false);
    setSelectedIndex(index);
    setEditingList(
      JSON.parse(
        JSON.stringify(localLists[index] || { name: "", products: [] }),
      ),
    );
    setIsDirty(false);
  };

  const addListFromPrompt = (item) => {
    if (!item || !item.name) return;

    api
      .createList({
        name: item.name,
        dueDate: item.dueDate || null,
        status: "active",
        products: item.products || [],
      })
      .then((created) => {
        setLocalLists((prev) => [created, ...prev]);
        setShowNewForm(false);
      })
      .catch((err) => alert(`Failed to create list: ${err.message}`));
  };

  const saveEditing = () => {
    if (!editingList || selectedIndex === null) return;

    setSaving(true);
    api
      .updateList(editingList.id, {
        name: editingList.name,
        dueDate: editingList.dueDate || null,
        status: editingList.status || "active",
        products: (editingList.products || []).map((product, index) => ({
          name: product.name,
          qty: product.qty,
          weight: product.weight || null,
          category: product.category || null,
          bought: Boolean(product.bought),
          position: index,
        })),
      })
      .then((updated) => {
        setLocalLists((prev) => {
          const copy = [...prev];
          copy[selectedIndex] = updated;
          return copy;
        });
        setEditingList(JSON.parse(JSON.stringify(updated)));
        setIsDirty(false);
      })
      .catch((err) => alert(`Failed to save: ${err.message}`))
      .finally(() => setSaving(false));
  };

  const changeListStatus = (status) => {
    if (!editingList?.id || selectedIndex === null) return;

    setSaving(true);
    api
      .updateListStatus(editingList.id, status)
      .then((updated) => {
        setLocalLists((prev) => {
          const copy = [...prev];
          copy[selectedIndex] = updated;
          return copy;
        });
        setEditingList(JSON.parse(JSON.stringify(updated)));
        setIsDirty(false);
      })
      .catch((err) => alert(`Failed to update list status: ${err.message}`))
      .finally(() => setSaving(false));
  };

  const activeCount = localLists.filter(
    (list) => (list.status || "active") === "active",
  ).length;
  const archivedCount = localLists.filter(
    (list) => list.status === "archived",
  ).length;

  const filteredLists = localLists
    .filter((list) => {
      if (statusFilter === "active") {
        return (list.status || "active") === "active";
      }
      if (statusFilter === "archived") {
        return list.status === "archived";
      }
      return true;
    })
    .sort(compareByNearestDueDate);

  const totalPages = Math.max(1, Math.ceil(filteredLists.length / PAGE_SIZE));
  const visibleLists = filteredLists.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">{t("common.loading", "Loading\u2026")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: "red" }}>
          {t("common.error", "Error:")} {error}
        </div>
      </div>
    );
  }

  if (selectedIndex !== null) {
    const selected = editingList || localLists[selectedIndex];

    return (
      <>
        <h2 className={`list-view-title ${viewClosing ? "exit" : "enter"}`}>
          {selected.name}
        </h2>
        <div className={`card list-detail ${viewClosing ? "exit" : "enter"}`}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <button
              className="back-button"
              onClick={() => {
                if (isDirty) {
                  setConfirmModal({
                    title: t("shopping.leaveTitle", "Leave without saving?"),
                    message: t(
                      "shopping.leaveMessage",
                      "You have unsaved changes. Leave without saving?",
                    ),
                    confirmLabel: t("shopping.leaveConfirm", "Leave"),
                    cancelLabel: t("common.cancel", "Cancel"),
                    onConfirm: () => {
                      setConfirmModal(null);
                      closeEditor();
                    },
                    onCancel: () => setConfirmModal(null),
                  });
                  return;
                }

                setViewClosing(true);
                setTimeout(() => {
                  setViewClosing(false);
                  closeEditor();
                }, ANIM_MS);
              }}
            >
              {t("common.back", "\u2190 Back")}
            </button>

            {isDirty && (
              <button
                className="save-button"
                disabled={saving}
                onClick={saveEditing}
              >
                {saving
                  ? t("common.saving", "Saving\u2026")
                  : t("common.save", "Save")}
              </button>
            )}

            {selected.ownerId === user?.id && (
              <button
                className="archive-list-btn"
                type="button"
                onClick={() => openShareModal(selected)}
              >
                {t("shopping.share", "Share")}
              </button>
            )}

            <button
              className="archive-list-btn"
              disabled={saving}
              onClick={() =>
                changeListStatus(
                  selected.status === "archived" ? "active" : "archived",
                )
              }
            >
              {selected.status === "archived"
                ? t("shopping.restore", "Restore")
                : t("shopping.archive", "Archive")}
            </button>

            <button
              className="remove-list-btn"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  title: t("shopping.deleteTitle", "Delete shopping list"),
                  message: `${t("shopping.deleteMessage", "Delete")} "${selected?.name}"? ${t("shopping.deleteWarning", "This cannot be undone.")}`,
                  confirmLabel: t("common.delete", "Delete"),
                  cancelLabel: t("common.cancel", "Cancel"),
                  onConfirm: () => {
                    removeList(selectedIndex);
                    setConfirmModal(null);
                  },
                  onCancel: () => setConfirmModal(null),
                });
              }}
              aria-label="Delete list"
              title="Delete list"
            >
              <span className="minus">−</span>
            </button>
          </div>

          <div>
            <input
              className="list-name-input"
              value={selected.name}
              onChange={(e) =>
                updateListField(selectedIndex, "name", e.target.value)
              }
              placeholder={t("shopping.listNamePlaceholder", "List name")}
            />

            <input
              className="list-name-input list-date-input"
              type="date"
              value={selected.dueDate || ""}
              onChange={(e) =>
                updateListField(
                  selectedIndex,
                  "dueDate",
                  e.target.value || null,
                )
              }
              aria-label="Shopping list due date"
            />

            <div className="products-edit">
              {selected.products && selected.products.length === 0 && (
                <p>{t("shopping.noProducts", "No products")}</p>
              )}

              {selected.products && selected.products.length > 0 && (
                <label className="shopping-bought-toggle list-toggle">
                  <input
                    type="checkbox"
                    checked={isListBought(selected.products || [])}
                    onChange={(e) => setAllProductsBought(e.target.checked)}
                  />
                  <span>
                    {t("shopping.markAllBought", "Mark all as purchased")}
                  </span>
                </label>
              )}

              {(selected.products || []).map((product, index) => (
                <div className="product-edit" key={index}>
                  <label className="shopping-bought-toggle product-toggle">
                    <input
                      type="checkbox"
                      checked={isProductBought(product)}
                      onChange={(e) =>
                        setProductBought(index, e.target.checked)
                      }
                    />
                  </label>
                  <input
                    className={`small input-name${isProductBought(product) ? " bought" : ""}`}
                    value={product.name}
                    onChange={(e) =>
                      updateProductField(
                        selectedIndex,
                        index,
                        "name",
                        e.target.value,
                      )
                    }
                  />
                  <select
                    className={`small input-category${isProductBought(product) ? " bought" : ""}`}
                    value={product.category || ""}
                    onChange={(e) =>
                      updateProductField(
                        selectedIndex,
                        index,
                        "category",
                        e.target.value || null,
                      )
                    }
                  >
                    <option value="">{t("shopping.categoryNone", "—")}</option>
                    {[
                      "dairy",
                      "meat",
                      "fruits",
                      "vegetables",
                      "bakery",
                      "beverages",
                      "snacks",
                      "frozen",
                      "spices",
                      "household",
                      "hygiene",
                      "other",
                    ].map((cat) => (
                      <option key={cat} value={cat}>
                        {t(`shopping.category.${cat}`, cat)}
                      </option>
                    ))}
                  </select>
                  <input
                    className={`small input-qty${isProductBought(product) ? " bought" : ""}`}
                    type="number"
                    min="0"
                    value={product.qty}
                    onChange={(e) =>
                      updateProductField(
                        selectedIndex,
                        index,
                        "qty",
                        Number(e.target.value),
                      )
                    }
                  />
                  <select
                    className={`small input-unit${isProductBought(product) ? " bought" : ""}`}
                    value={product.weight || "szt"}
                    onChange={(e) =>
                      updateProductField(
                        selectedIndex,
                        index,
                        "weight",
                        e.target.value,
                      )
                    }
                  >
                    {["szt", "kg", "g", "l", "ml", "opak"].map((u) => (
                      <option key={u} value={u}>
                        {t(`shopping.unit.${u}`, u)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="remove-product-icon"
                    onClick={() => removeProduct(selectedIndex, index)}
                    title="Remove product"
                    aria-label="Remove product"
                  >
                    <span className="minus">−</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="add-product-form">
              <ProductForm
                onAdd={(product) => addProduct(selectedIndex, product)}
                addLabel={t("shopping.addProduct", "Add Product")}
              />
            </div>
          </div>
        </div>
        <ShareUserModal
          isOpen={Boolean(shareTarget)}
          title={t("shopping.shareTitle", "Share shopping list")}
          loading={shareUsersLoading}
          users={shareUsers}
          search={shareSearch}
          onSearchChange={setShareSearch}
          currentUserId={user?.id}
          alreadySharedUserIds={shareTarget?.sharedWithUserIds ?? []}
          onClose={closeShareModal}
          onConfirm={handleShareList}
        />
        {confirmModal && <ConfirmModal {...confirmModal} />}
      </>
    );
  }

  return (
    <>
      {showNewForm && (
        <NewShoppingList
          onCreate={addListFromPrompt}
          onCancel={() => setShowNewForm(false)}
        />
      )}
      <div className="card">
        <div className="card-header">
          <h2>{t("shopping.title", "Shopping Lists")}</h2>
          <button
            type="button"
            className="add-list-plus"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewForm(true);
            }}
            aria-label="Add shopping list"
          >
            <span className="plus">+</span>
          </button>
        </div>

        <div className="list-status-filters">
          <button
            type="button"
            className={`list-status-filter-btn${statusFilter === "all" ? " active" : ""}`}
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          >
            {t("shopping.filterAll", "All")} ({localLists.length})
          </button>
          <button
            type="button"
            className={`list-status-filter-btn${statusFilter === "active" ? " active" : ""}`}
            onClick={() => {
              setStatusFilter("active");
              setPage(1);
            }}
          >
            {t("shopping.filterActive", "Active")} ({activeCount})
          </button>
          <button
            type="button"
            className={`list-status-filter-btn${statusFilter === "archived" ? " active" : ""}`}
            onClick={() => {
              setStatusFilter("archived");
              setPage(1);
            }}
          >
            {t("shopping.filterArchived", "Archived")} ({archivedCount})
          </button>
        </div>

        <div className="list-grid">
          {visibleLists.map((list) => (
            <div
              key={list.id}
              className="list-item"
              style={{
                "--shopping-accent": colorForUserKey(
                  list.createdBy ?? list.ownerId,
                ),
              }}
              onClick={() =>
                handleSelect(
                  localLists.findIndex((current) => current.id === list.id),
                )
              }
            >
              <strong>
                {list.name}
                {list.status === "archived" && (
                  <span className="list-status-badge">
                    {t("shopping.archived", "Archived")}
                  </span>
                )}
              </strong>
              <div className="list-item-meta">
                <div className="list-count">
                  {(list.products || []).length} {t("shopping.items", "items")}
                </div>
                {list.ownerId === user?.id && (
                  <button
                    type="button"
                    className="show-more-btn list-share-btn"
                    title={t("shopping.shareList", "Share list")}
                    aria-label={t("shopping.shareList", "Share list")}
                    onClick={(event) => {
                      event.stopPropagation();
                      openShareModal(list);
                    }}
                  >
                    👥
                  </button>
                )}
                <div
                  className={`list-due-date${getDueDateStatus(list.dueDate) ? ` is-${getDueDateStatus(list.dueDate)}` : ""}`}
                >
                  {t("shopping.dueDate", "Due:")}{" "}
                  {formatDueDate(list.dueDate) ??
                    t("shopping.noDueDate", "No due date")}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
      <ShareUserModal
        isOpen={Boolean(shareTarget)}
        title="Udostępnij listę zakupów"
        loading={shareUsersLoading}
        users={shareUsers}
        search={shareSearch}
        onSearchChange={setShareSearch}
        currentUserId={user?.id}
        alreadySharedUserIds={shareTarget?.sharedWithUserIds ?? []}
        onClose={closeShareModal}
        onConfirm={handleShareList}
      />
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </>
  );
}
