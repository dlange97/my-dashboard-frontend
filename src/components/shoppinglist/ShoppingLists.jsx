import React, { useEffect, useState } from "react";
import ProductForm from "./ProductForm";
import NewShoppingList from "./NewShoppingList";
import ConfirmModal from "../ui/ConfirmModal";
import api from "../../api/api";

export default function ShoppingLists({
  onSelectionChange,
  initialSelectedListId = null,
}) {
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
  const [showAllLists, setShowAllLists] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const ANIM_MS = 360;

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
        status: editingList.status || "active",
        products: (editingList.products || []).map((product, index) => ({
          name: product.name,
          qty: product.qty,
          weight: product.weight || null,
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

  const filteredLists = localLists.filter((list) => {
    if (statusFilter === "active") {
      return (list.status || "active") === "active";
    }
    if (statusFilter === "archived") {
      return list.status === "archived";
    }
    return true;
  });

  const visibleLists = showAllLists ? filteredLists : filteredLists.slice(0, 5);

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body" style={{ color: "red" }}>
          Error: {error}
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
                    title: "Leave without saving?",
                    message: "You have unsaved changes. Leave without saving?",
                    confirmLabel: "Leave",
                    cancelLabel: "Cancel",
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
              ← Back
            </button>

            {isDirty && (
              <button
                className="save-button"
                disabled={saving}
                onClick={saveEditing}
              >
                {saving ? "Saving…" : "Save"}
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
              {selected.status === "archived" ? "Przywróć" : "Archiwizuj"}
            </button>

            <button
              className="remove-list-btn"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmModal({
                  title: "Delete shopping list",
                  message: `Delete "${selected?.name}"? This cannot be undone.`,
                  confirmLabel: "Delete",
                  cancelLabel: "Cancel",
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
              placeholder="List name"
            />

            <div className="products-edit">
              {selected.products && selected.products.length === 0 && (
                <p>No products</p>
              )}

              {selected.products && selected.products.length > 0 && (
                <label className="shopping-bought-toggle list-toggle">
                  <input
                    type="checkbox"
                    checked={isListBought(selected.products || [])}
                    onChange={(e) => setAllProductsBought(e.target.checked)}
                  />
                  <span>Oznacz całą listę jako kupioną</span>
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
                  <input
                    className={`small input-weight${isProductBought(product) ? " bought" : ""}`}
                    placeholder="weight"
                    value={product.weight || ""}
                    onChange={(e) =>
                      updateProductField(
                        selectedIndex,
                        index,
                        "weight",
                        e.target.value,
                      )
                    }
                  />
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
                addLabel="Add Product"
              />
            </div>
          </div>
        </div>
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
          <h2>Shopping Lists</h2>
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
              setShowAllLists(false);
            }}
          >
            Wszystkie ({localLists.length})
          </button>
          <button
            type="button"
            className={`list-status-filter-btn${statusFilter === "active" ? " active" : ""}`}
            onClick={() => {
              setStatusFilter("active");
              setShowAllLists(false);
            }}
          >
            Aktywne ({activeCount})
          </button>
          <button
            type="button"
            className={`list-status-filter-btn${statusFilter === "archived" ? " active" : ""}`}
            onClick={() => {
              setStatusFilter("archived");
              setShowAllLists(false);
            }}
          >
            Archiwalne ({archivedCount})
          </button>
        </div>

        <div className="list-grid">
          {visibleLists.map((list) => (
            <div
              key={list.id}
              className="list-item"
              onClick={() =>
                handleSelect(
                  localLists.findIndex((current) => current.id === list.id),
                )
              }
            >
              <strong>
                {list.name}
                {list.status === "archived" && (
                  <span className="list-status-badge">Archived</span>
                )}
              </strong>
              <div className="list-count">
                {(list.products || []).length} items
              </div>
            </div>
          ))}
        </div>

        {filteredLists.length > 5 && (
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <button
              type="button"
              className="show-more-btn"
              onClick={() => setShowAllLists((shown) => !shown)}
            >
              {showAllLists
                ? "Show less"
                : `Show ${filteredLists.length - 5} more`}
            </button>
          </div>
        )}
      </div>
      {confirmModal && <ConfirmModal {...confirmModal} />}
    </>
  );
}
