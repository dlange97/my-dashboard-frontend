import React from "react";
import { useSearchParams } from "react-router-dom";
import NavBar from "../components/nav/NavBar";
import ShoppingLists from "../components/shoppinglist/ShoppingLists";
import InboxSidebar from "../components/notifications/InboxSidebar";

export default function ShoppingPage() {
  const [searchParams] = useSearchParams();
  const initialListId = searchParams.get("listId");

  return (
    <div className="page-shell">
      <NavBar />
      <div className="app-shell-with-inbox">
        <InboxSidebar />
        <main
          className="page-content app-shell-main"
          style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto" }}
        >
          <ShoppingLists
            onSelectionChange={() => {}}
            initialSelectedListId={initialListId}
          />
        </main>
      </div>
    </div>
  );
}
