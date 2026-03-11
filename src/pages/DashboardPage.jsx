import React, { useEffect, useMemo, useState } from "react";
import NavBar from "../components/nav/NavBar";
import TodoSummary from "../components/dashboard/TodoSummary";
import ShoppingSummary from "../components/dashboard/ShoppingSummary";
import EventsSummary from "../components/events/EventsSummary";
import InboxSidebar from "../components/notifications/InboxSidebar";
import { useAuth } from "../context/AuthContext";

const TILE_STORAGE_KEY = "dashboard_tiles_order_v1";

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
];

const DEFAULT_ORDER = TILE_DEFINITIONS.map((tile) => tile.id);

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

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const firstName = user?.firstName ?? user?.email?.split("@")[0] ?? "there";
  const [tileOrder, setTileOrder] = useState(() => {
    const raw = localStorage.getItem(TILE_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_ORDER;
    }

    try {
      return normalizeOrder(JSON.parse(raw));
    } catch {
      return DEFAULT_ORDER;
    }
  });
  const [draggedTileId, setDraggedTileId] = useState(null);
  const [dropTargetTileId, setDropTargetTileId] = useState(null);

  const visibleTiles = useMemo(
    () => TILE_DEFINITIONS.filter((tile) => hasPermission(tile.permission)),
    [hasPermission],
  );

  const orderedVisibleTiles = useMemo(() => {
    const byId = new Map(visibleTiles.map((tile) => [tile.id, tile]));
    return tileOrder.map((id) => byId.get(id)).filter(Boolean);
  }, [tileOrder, visibleTiles]);

  useEffect(() => {
    localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(tileOrder));
  }, [tileOrder]);

  const handleDragStart = (tileId) => {
    setDraggedTileId(tileId);
    setDropTargetTileId(null);
  };

  const handleDrop = (targetTileId) => {
    setTileOrder((current) => moveTile(current, draggedTileId, targetTileId));
    setDraggedTileId(null);
    setDropTargetTileId(null);
  };

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main className="page-content app-shell-main dashboard-page">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p className="greeting">
              Welcome back, {firstName}! Here's your overview.
            </p>
          </div>
          <div className="summary-grid">
            {orderedVisibleTiles.map((tile) => (
              <div
                key={tile.id}
                className={`summary-tile${draggedTileId === tile.id ? " dragging" : ""}${
                  dropTargetTileId === tile.id ? " drop-target" : ""
                }`}
                draggable
                onDragStart={() => handleDragStart(tile.id)}
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
                title="Przeciągnij, aby zmienić kolejność"
              >
                {tile.render()}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
