import React from "react";
import Product from "./Product";

export default function ShoppingList({
  products = [],
  title = "Shopping List",
}) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {products.length === 0 ? (
        <p>No items</p>
      ) : (
        products.map((p, i) => <Product key={i} product={p} />)
      )}
    </div>
  );
}
