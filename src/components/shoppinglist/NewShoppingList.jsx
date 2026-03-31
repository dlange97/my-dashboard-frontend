import React, { useState } from "react";
import ProductForm from "./ProductForm";
import { useTranslation } from "../../context/TranslationContext";

const ANIM_MS = 360;

export default function NewShoppingList({ onCreate, onCancel }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [products, setProducts] = useState([]);
  const [closing, setClosing] = useState(false);
  const [nameError, setNameError] = useState(false);

  const startClose = (cb) => {
    setClosing(true);
    setTimeout(() => {
      cb && cb();
    }, ANIM_MS + 20);
  };

  const submit = (e) => {
    e && e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    startClose(
      () =>
        onCreate &&
        onCreate({ name: name.trim(), dueDate: dueDate || null, products }),
    );
  };

  const addProduct = (p) => setProducts((prev) => [...prev, p]);
  const removeProduct = (idx) =>
    setProducts((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className={`modal-overlay ${closing ? "closing" : ""}`}>
      <form className={`modal ${closing ? "closing" : ""}`} onSubmit={submit}>
        <h3 className="modal-heading">{t("shopping.newList", "+ New List")}</h3>

        <div className="form-field">
          <label htmlFor="new-list-name">
            {t("shopping.listNamePlaceholder", "List name")}
          </label>
          <input
            id="new-list-name"
            autoFocus
            className={nameError ? "input-error" : ""}
            placeholder={t("shopping.listNamePlaceholder", "List name")}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError && e.target.value.trim()) setNameError(false);
            }}
          />
          {nameError && (
            <span className="field-error">
              {t("common.fieldRequired", "This field is required")}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="new-list-due">
            {t("shopping.dueDateLabel", "Due date (optional)")}
          </label>
          <input
            id="new-list-due"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="modal-products">
          <h4>{t("shopping.products", "Products")}</h4>
          {products.length === 0 && (
            <p>{t("shopping.noProductsYet", "No products yet")}</p>
          )}
          {products.map((p, i) => (
            <div className="product-row" key={i}>
              <div>
                {p.category && (
                  <span className="product-category-badge">
                    {t(`shopping.category.${p.category}`, p.category)}
                  </span>
                )}{" "}
                {p.name} — {p.qty} {p.weight || t("shopping.unit.szt", "szt")}
              </div>
              <button
                type="button"
                className="remove-product-icon"
                onClick={() => removeProduct(i)}
                title={t("shopping.removeProduct", "Remove product")}
                aria-label={t("shopping.removeProduct", "Remove product")}
              >
                <span className="minus">−</span>
              </button>
            </div>
          ))}
        </div>

        <ProductForm
          onAdd={addProduct}
          addLabel={t("shopping.addToList", "Add to list")}
        />

        <div className="modal-actions">
          <button
            type="button"
            className="btn-muted"
            onClick={() => startClose(onCancel)}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button type="submit" className="btn-primary">
            {t("shopping.create", "Create")}
          </button>
        </div>
      </form>
    </div>
  );
}
