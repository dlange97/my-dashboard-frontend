import React, { useState } from "react";

export default function ProductForm({
  onAdd,
  initial = { name: "", qty: 1, weight: "" },
  addLabel = "Add product",
}) {
  const [product, setProduct] = useState(initial);

  const submit = (e) => {
    e && e.preventDefault();
    if (!product.name) return;
    onAdd && onAdd({ ...product });
    setProduct(initial);
  };

  return (
    <form className="product-form" onSubmit={submit}>
      <div className="form-field product-name-field">
        <label htmlFor="pf-name">Product name</label>
        <input
          id="pf-name"
          placeholder="e.g. Apples"
          value={product.name}
          onChange={(e) => setProduct((p) => ({ ...p, name: e.target.value }))}
        />
      </div>
      <div className="product-form-row">
        <div className="form-field">
          <label htmlFor="pf-qty">Qty</label>
          <input
            id="pf-qty"
            type="number"
            min="0"
            value={product.qty}
            onChange={(e) =>
              setProduct((p) => ({ ...p, qty: Number(e.target.value) }))
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="pf-weight">
            Weight <span className="optional">(opt.)</span>
          </label>
          <input
            id="pf-weight"
            placeholder="e.g. 500g"
            value={product.weight}
            onChange={(e) =>
              setProduct((p) => ({ ...p, weight: e.target.value }))
            }
          />
        </div>
        <button
          type="button"
          className="add-product-btn"
          onClick={submit}
          title={addLabel}
          aria-label={addLabel}
        >
          + {addLabel}
        </button>
      </div>
    </form>
  );
}
