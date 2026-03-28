import React, { useEffect, useMemo, useRef, useState } from "react";
import NavBar from "../components/nav/NavBar";
import TodoSummary from "../components/dashboard/TodoSummary";
import ShoppingSummary from "../components/dashboard/ShoppingSummary";
import CalendarSummary from "../components/dashboard/CalendarSummary";
import EventsSummary from "../components/events/EventsSummary";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { ConfirmModal } from "../components/ui";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "../context/TranslationContext";

const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;

const TILE_DEFINITIONS = [
  {
    id: "todos",
    permission: "todos.view",
    render: () => <TodoSummary />,
  },
  {
    id: "shopping",
    permission: "shopping.view",
    render: () => <ShoppingSummary />,
  },
  {
    id: "events",
    permission: "events.view",
    render: () => <EventsSummary />,
  },
  {
    id: "calendar",
    permission: "events.view",
    tileClassName: "summary-tile-wide",
    render: () => <CalendarSummary />,
  },
];

const DEFAULT_ORDER = TILE_DEFINITIONS.map((tile) => tile.id);
const DEFAULT_SCALES = Object.fromEntries(
  TILE_DEFINITIONS.map((tile) => [tile.id, { x: 1, y: 1 }]),
);

function normalizeOrder(order) {
  if (!Array.isArray(order)) {
    return DEFAULT_ORDER;
  }

  const valid = order.filter((id) => DEFAULT_ORDER.includes(id));
  const missing = DEFAULT_ORDER.filter((id) => !valid.includes(id));

  return [...valid, ...missing];
}

function moveTile(order, draggedId, targetId) {
  if (!draggedId || !targetId || draggedId === targetId) {
    return order;
  }

  const draggedIndex = order.indexOf(draggedId);
  const targetIndex = order.indexOf(targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return order;
  }

  const next = [...order];
  const [dragged] = next.splice(draggedIndex, 1);
  next.splice(targetIndex, 0, dragged);

  return next;
}

function clampScale(value) {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));
}

function normalizeTileScale(rawScale) {
  if (typeof rawScale === "number") {
    const normalized = Number(clampScale(rawScale).toFixed(3));
    return { x: normalized, y: normalized };
  }

  if (!rawScale || typeof rawScale !== "object") {
    return { x: 1, y: 1 };
  }

  const x = Number(rawScale.x);
  const y = Number(rawScale.y);

  return {
    x: Number(clampScale(Number.isNaN(x) ? 1 : x).toFixed(3)),
    y: Number(clampScale(Number.isNaN(y) ? 1 : y).toFixed(3)),
  };
}

function getTileColumnSpan(tile, scaleX) {
  const baseSpan = tile.tileClassName === "summary-tile-wide" ? 8 : 4;
  return Math.max(2, Math.min(12, Math.round(baseSpan * scaleX)));
}

function normalizeDashboardLayout(layout) {
  const order = normalizeOrder(layout?.order);
  const scales = { ...DEFAULT_SCALES };

  if (layout && typeof layout === "object" && layout.scales) {
    for (const [tileId, rawScale] of Object.entries(layout.scales)) {
      if (!(tileId in scales)) continue;
      scales[tileId] = normalizeTileScale(rawScale);
    }
  }

  return { order, scales };
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const { t } = useTranslation();
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? t("dashboard.guest", "there");
  const initialLayout = normalizeDashboardLayout(user?.dashboardLayout ?? null);
  const [tileOrder, setTileOrder] = useState(initialLayout.order);
  const [tileScales, setTileScales] = useState(initialLayout.scales);
  const [draggedTileId, setDraggedTileId] = useState(null);
  const [dropTargetTileId, setDropTargetTileId] = useState(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [resizingTileId, setResizingTileId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const lastPersistedRef = useRef("");
  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    tileId: null,
  });
  const resizeFrameRef = useRef(null);
  const resizeNextRef = useRef(null);

  const visibleTiles = useMemo(
    () => TILE_DEFINITIONS.filter((tile) => hasPermission(tile.permission)),
    [hasPermission],
  );

  const orderedVisibleTiles = useMemo(() => {
    const byId = new Map(visibleTiles.map((tile) => [tile.id, tile]));
    const fromOrder = tileOrder.map((id) => byId.get(id)).filter(Boolean);
    const present = new Set(fromOrder.map((tile) => tile.id));
    const missing = visibleTiles.filter((tile) => !present.has(tile.id));
    return [...fromOrder, ...missing];
  }, [tileOrder, visibleTiles]);

  useEffect(() => {
    let active = true;
    let normalized = initialLayout;

    api
      .me()
      .then((response) => {
        normalized = normalizeDashboardLayout(response?.user?.dashboardLayout ?? null);
        if (!active) return;
        setTileOrder(normalized.order);
        setTileScales(normalized.scales);
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        lastPersistedRef.current = JSON.stringify({
          order: normalized.order,
          scales: normalized.scales,
        });
        setLayoutReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!layoutReady) {
      return;
    }

    const payload = { order: tileOrder, scales: tileScales };
    const serialized = JSON.stringify(payload);

    if (serialized === lastPersistedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      api
        .updateMyDashboardLayout(payload)
        .then(() => {
          lastPersistedRef.current = serialized;
        })
        .catch(() => {});
    }, 350);

    return () => clearTimeout(timer);
  }, [tileOrder, tileScales, layoutReady]);

  const handleDragStart = (tileId) => {
    setDraggedTileId(tileId);
    setDropTargetTileId(null);
  };

  const handleDrop = (targetTileId) => {
    setTileOrder((current) => moveTile(current, draggedTileId, targetTileId));
    setDraggedTileId(null);
    setDropTargetTileId(null);
  };

  const handleResizeStart = (e, tileId) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedTileId(null);
    setDropTargetTileId(null);
    setResizingTileId(tileId);
    const currentScale = tileScales[tileId] ?? DEFAULT_SCALES[tileId];
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scaleX: currentScale.x,
      scaleY: currentScale.y,
      tileId,
    };
  };

  useEffect(() => {
    if (!resizingTileId) return;

    const handleMouseMove = (e) => {
      const { x, y, scaleX, scaleY, tileId } = resizeStartRef.current;
      const deltaX = e.clientX - x;
      const deltaY = e.clientY - y;
      const nextX = Number(clampScale(scaleX + deltaX * 0.00135).toFixed(3));
      const nextY = Number(clampScale(scaleY + deltaY * 0.0015).toFixed(3));

      resizeNextRef.current = {
        tileId,
        scale: { x: nextX, y: nextY },
      };

      if (resizeFrameRef.current !== null) {
        return;
      }

      resizeFrameRef.current = requestAnimationFrame(() => {
        resizeFrameRef.current = null;
        const pending = resizeNextRef.current;
        if (!pending) return;

        setTileScales((current) => {
          const currentScale = current[pending.tileId] ?? DEFAULT_SCALES[pending.tileId];
          if (
            currentScale.x === pending.scale.x &&
            currentScale.y === pending.scale.y
          ) {
            return current;
          }

          return {
            ...current,
            [pending.tileId]: pending.scale,
          };
        });
      });
    };

    const handleMouseUp = () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      resizeNextRef.current = null;
      setResizingTileId(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
      resizeNextRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingTileId]);

  const handleResetLayout = () => {
    setTileOrder(DEFAULT_ORDER);
    setTileScales(DEFAULT_SCALES);
    setShowResetConfirm(false);
  };

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main dashboard-page">
          <div className="dashboard-header">
            <div className="dashboard-header-copy">
              <h1>{t("dashboard.title", "Dashboard")}</h1>
              <p className="greeting">
                {t("dashboard.welcomeBack", "Welcome back")}, {firstName}! {t("dashboard.overview", "Here's your overview.")}
              </p>
            </div>
            <button
              type="button"
              className="dashboard-reset-layout-btn"
              onClick={() => setShowResetConfirm(true)}
            >
              {t("dashboard.resetTiles", "Reset tile settings")}
            </button>
          </div>
          <div className="summary-grid">
            {orderedVisibleTiles.map((tile) => (
              <div
                key={tile.id}
                data-testid={`dashboard-tile-${tile.id}`}
                className={`summary-tile tile-span-${getTileColumnSpan(tile, (tileScales[tile.id] ?? DEFAULT_SCALES[tile.id]).x)} ${tile.tileClassName ?? ""}${draggedTileId === tile.id ? " dragging" : ""}${
                  dropTargetTileId === tile.id ? " drop-target" : ""
                }${resizingTileId === tile.id ? " resizing" : ""}`}
                style={{
                  "--tile-scale-x": (tileScales[tile.id] ?? DEFAULT_SCALES[tile.id]).x,
                  "--tile-scale-y": (tileScales[tile.id] ?? DEFAULT_SCALES[tile.id]).y,
                }}
                draggable={resizingTileId === null}
                onDragStart={(e) => {
                  if (resizingTileId !== null) {
                    e.preventDefault();
                    return;
                  }
                  handleDragStart(tile.id);
                }}
                onDragEnd={() => {
                  setDraggedTileId(null);
                  setDropTargetTileId(null);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedTileId !== tile.id) {
                    setDropTargetTileId(tile.id);
                  }
                }}
                onDragLeave={() => {
                  if (dropTargetTileId === tile.id) {
                    setDropTargetTileId(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(tile.id);
                }}
                title={t("dashboard.reorderHint", "Drag to reorder")}
              >
                <div
                  data-testid={`dashboard-resize-${tile.id}`}
                  className="summary-tile-resize-handle"
                  onMouseDown={(e) => handleResizeStart(e, tile.id)}
                  onClick={(e) => e.stopPropagation()}
                  title={t("dashboard.resizeHint", "Drag to resize")}
                  role="button"
                  tabIndex={0}
                />
                {tile.render()}
              </div>
            ))}
          </div>
        </main>
      </div>

      {showResetConfirm && (
        <ConfirmModal
          title={t("dashboard.resetConfirmTitle", "Reset tile settings?")}
          message={t(
            "dashboard.resetConfirmMessage",
            "This will restore the default tile order and sizes.",
          )}
          confirmLabel={t("dashboard.resetConfirmAction", "Reset")}
          cancelLabel={t("dashboard.resetConfirmCancel", "Cancel")}
          onConfirm={handleResetLayout}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
