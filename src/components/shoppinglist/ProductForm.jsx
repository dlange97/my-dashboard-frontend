import React, { useState } from "react";
import { useTranslation } from "../../context/TranslationContext";

const CATEGORIES = [
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
];

const UNITS = ["szt", "kg", "g", "l", "ml", "opak"];

export default function ProductForm({
  onAdd,
  initial = { name: "", qty: 1, weight: "szt", category: "" },
  addLabel,
}) {
  const { t } = useTranslation();
  const [product, setProduct] = useState(initial);
  const [nameError, setNameError] = useState(false);

  const resolvedAddLabel = addLabel || t("shopping.addProduct", "Add product");

  const submit = (e) => {
    e && e.preventDefault();
    if (!product.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);
    onAdd && onAdd({ ...product, name: product.name.trim() });
    setProduct(initial);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submit(e);
    }
  };

  return (
    <div className="product-form" role="group" onKeyDown={handleKeyDown}>
      <div className="product-form-top-row">
        <div className="form-field product-name-field">
          <label htmlFor="pf-name">
            {t("shopping.productName", "Product name")}
          </label>
          <input
            id="pf-name"
            className={nameError ? "input-error" : ""}
            placeholder={t("shopping.productNamePlaceholder", "e.g. Apples")}
            value={product.name}
            onChange={(e) => {
              setProduct((p) => ({ ...p, name: e.target.value }));
              if (nameError && e.target.value.trim()) setNameError(false);
            }}
          />
          {nameError && (
            <span className="field-error">
              {t("common.fieldRequired", "This field is required")}
            </span>
          )}
        </div>
        <div className="form-field product-category-field">
          <label htmlFor="pf-category">
            {t("shopping.category", "Category")}
          </label>
          <select
            id="pf-category"
            value={product.category}
            onChange={(e) =>
              setProduct((p) => ({ ...p, category: e.target.value }))
            }
          >
            <option value="">{t("shopping.categoryNone", "— select —")}</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {t(`shopping.category.${cat}`, cat)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="product-form-row">
        <div className="form-field product-qty-field">
          <label htmlFor="pf-qty">{t("shopping.qty", "Qty")}</label>
          <input
            id="pf-qty"
            type="number"
            min="1"
            step="1"
            value={product.qty}
            onChange={(e) =>
              setProduct((p) => ({ ...p, qty: Number(e.target.value) }))
            }
          />
        </div>
        <div className="form-field product-unit-field">
          <label htmlFor="pf-unit">{t("shopping.unit", "Unit")}</label>
          <select
            id="pf-unit"
            value={product.weight || "szt"}
            onChange={(e) =>
              setProduct((p) => ({ ...p, weight: e.target.value }))
            }
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {t(`shopping.unit.${u}`, u)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="add-product-btn"
          onClick={submit}
          title={resolvedAddLabel}
          aria-label={resolvedAddLabel}
        >
          + {resolvedAddLabel}
        </button>
      </div>
    </div>
  );
}
