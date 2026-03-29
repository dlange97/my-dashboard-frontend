import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";

export default function ShoppingSummary() {
  const { t } = useTranslation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLists()
      .then((data) =>
        setLists((data ?? []).filter((list) => list.status !== "archived")),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = lists.slice(0, 4);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-shop">🛒</span>
          {t("shopping.title", "Shopping Lists")}
        </div>
        <Link to="/shopping" className="summary-go-link">
          {t("shopping.viewAll", "View all →")}
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : lists.length === 0 ? (
        <div className="empty-state">{t("shopping.empty", "No shopping lists yet.")}</div>
      ) : (
        <>
          <div className="shop-summary-list">
            {shown.map((l) => (
              <Link
                key={l.id}
                to={`/shopping?listId=${l.id}`}
                className="shop-summary-item shop-summary-link"
              >
                <span className="shop-item-name">{l.name}</span>
                <span className="shop-item-count">
                  {l.products?.length ?? 0} {t("shopping.items", "items")}
                </span>
              </Link>
            ))}
          </div>
          {lists.length > 4 && (
            <div className="summary-stat">+{lists.length - 4} {t("shopping.moreLists", "more lists")}</div>
          )}
        </>
      )}
    </div>
  );
}
