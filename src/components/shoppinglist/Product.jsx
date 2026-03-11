import React from "react";

export default function Product({ product }) {
  return (
    <div className="product">
      <span className="product-name">{product.name}</span>
      <span className="product-qty">x{product.qty}</span>
    </div>
  );
}
