import React, { useState } from "react";
import ProductForm from "./ProductForm";

const ANIM_MS = 360; // should match --view-duration in CSS

export default function NewShoppingList({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [products, setProducts] = useState([]);
  const [closing, setClosing] = useState(false);

  const startClose = (cb) => {
    setClosing(true);
    setTimeout(() => {
      cb && cb();
    }, ANIM_MS + 20);
  };

  const submit = (e) => {
    e && e.preventDefault();
    if (!name) return;
    startClose(() =>
      onCreate && onCreate({ name, dueDate: dueDate || null, products }),
    );
  };

  const addProduct = (p) => setProducts((prev) => [...prev, p]);
  const removeProduct = (idx) =>
    setProducts((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className={`modal-overlay ${closing ? "closing" : ""}`}>
      <form className={`modal ${closing ? "closing" : ""}`} onSubmit={submit}>
        <input
          autoFocus
          placeholder="List name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          aria-label="Shopping list due date"
        />

        <div className="modal-products">
          <h4>Products</h4>
          {products.length === 0 && <p>No products yet</p>}
          {products.map((p, i) => (
            <div className="product-row" key={i}>
              <div>
                {p.name} x{p.qty} {p.weight ? `(${p.weight})` : ""}
              </div>
              <button
                type="button"
                className="remove-product-icon"
                onClick={() => removeProduct(i)}
                title="Remove product"
                aria-label="Remove product"
              >
                <span className="minus">−</span>
              </button>
            </div>
          ))}
        </div>

        <ProductForm onAdd={addProduct} addLabel="Add to list" />

        <div className="modal-actions">
          <button
            type="button"
            className="btn-muted"
            onClick={() => startClose(onCancel)}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
