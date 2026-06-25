import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/api";
import { useTranslation } from "../../context/TranslationContext";
import { useAuth } from "../../context/AuthContext";

const STATUS_STYLES = {
  active: { bg: "#d1fae5", color: "#065f46" },
  completed: { bg: "#dbeafe", color: "#1e40af" },
  pending: { bg: "#fef9c3", color: "#854d0e" },
};

function getStatusStyle(status) {
  return STATUS_STYLES[status] ?? { bg: "#f1f5f9", color: "#475569" };
}

function shortName(name) {
  if (!name) return "—";
  return name.replace(/^seed\d+\s+/i, "");
}

export default function ShoppingSummary() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.instanceId) return;

    api
      .getLists()
      .then((data) =>
        setLists((data ?? []).filter((list) => list.status !== "archived")),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.instanceId]);

  const shown = lists.slice(0, 4);

  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className="summary-card-title">
          <span className="icon icon-shop">🛒</span>
          {t("shopping.title", "Shopping Lists")}
        </div>
        <Link to="/shopping" className="summary-go-link">
          {t("common.viewAll", "View all")} →
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">{t("common.loading", "Loading…")}</div>
      ) : lists.length === 0 ? (
        <div className="empty-state">
          {t("shopping.empty", "No shopping lists yet.")}
        </div>
      ) : (
        <>
          <div className="shop-summary-list">
            {shown.map((l) => {
              const style = getStatusStyle(l.status);
              const count = l.products?.length ?? 0;
              return (
                <Link
                  key={l.id}
                  to={`/shopping?listId=${l.id}`}
                  className="shop-summary-item shop-summary-link"
                  title={l.name}
                >
                  <span className="shop-item-icon">🛒</span>
                  <span className="shop-item-name">{shortName(l.name)}</span>
                  <span
                    className="shop-item-count"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {count} {t("shopping.items", "prod.")}
                  </span>
                </Link>
              );
            })}
          </div>
          {lists.length > 4 && (
            <div className="summary-stat">
              +{lists.length - 4} {t("common.more", "more")}
            </div>
          )}
        </>
      )}
    </div>
  );
}
