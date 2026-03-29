import React, { useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "../../context/TranslationContext";
import "./pagination.css";

function buildPageItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("dots-left");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("dots-right");
  }

  pages.push(totalPages);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className = "",
}) {
  const { t } = useTranslation();
  const jumpInputId = useId();
  const [jumpValue, setJumpValue] = useState(String(page));
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return false;
    }
    return window.matchMedia("(max-width: 700px)").matches;
  });

  useEffect(() => {
    setJumpValue(String(page));
  }, [page]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return undefined;
    }

    const media = window.matchMedia("(max-width: 700px)");
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  const pageItems = useMemo(
    () => buildPageItems(page, totalPages),
    [page, totalPages],
  );

  const mobilePageItems = useMemo(() => {
    const values = new Set([
      1,
      Math.max(1, page - 1),
      page,
      Math.min(totalPages, page + 1),
      totalPages,
    ]);

    return Array.from(values)
      .filter((entry) => entry >= 1 && entry <= totalPages)
      .sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  const goTo = (nextPage) => {
    if (!Number.isFinite(nextPage)) return;
    const bounded = Math.max(1, Math.min(totalPages, nextPage));
    if (bounded !== page) {
      onPageChange?.(bounded);
    }
  };

  return (
    <div className={`pager ${isMobile ? "is-mobile" : ""} ${className}`.trim()}>
      {isMobile ? (
        <>
          <div
            className="pager-mobile-nav"
            role="group"
            aria-label={t("common.pagination", "Pagination")}
          >
            <button
              type="button"
              className="pager-nav pager-nav-mobile"
              onClick={() => goTo(page - 1)}
              disabled={page === 1}
              aria-label={t("common.previous", "Previous")}
            >
              <span aria-hidden="true">◀</span>
              <span>{t("common.previous", "Previous")}</span>
            </button>

            <div className="pager-mobile-meta" aria-live="polite">
              {t("common.page", "Page")} {page} / {totalPages}
            </div>

            <button
              type="button"
              className="pager-nav pager-nav-mobile"
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages}
              aria-label={t("common.next", "Next")}
            >
              <span>{t("common.next", "Next")}</span>
              <span aria-hidden="true">▶</span>
            </button>
          </div>

          <div className="pager-pages pager-pages-mobile">
            {mobilePageItems.map((item) => (
              <button
                type="button"
                key={item}
                className={`pager-page-btn${item === page ? " is-active" : ""}`}
                onClick={() => goTo(item)}
                aria-current={item === page ? "page" : undefined}
                title={`${t("common.page", "Page")} ${item}`}
              >
                {item}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            className="pager-nav"
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            aria-label={t("common.previous", "Previous")}
            title={t("common.previous", "Previous")}
          >
            <span aria-hidden="true">◀</span>
          </button>

          <div
            className="pager-pages"
            role="navigation"
            aria-label={t("common.pagination", "Pagination")}
          >
            {pageItems.map((item) => {
              if (typeof item !== "number") {
                return (
                  <span key={item} className="pager-dots" aria-hidden="true">
                    ...
                  </span>
                );
              }

              return (
                <button
                  type="button"
                  key={item}
                  className={`pager-page-btn${item === page ? " is-active" : ""}`}
                  onClick={() => goTo(item)}
                  aria-current={item === page ? "page" : undefined}
                  title={`${t("common.page", "Page")} ${item}`}
                >
                  {item}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className="pager-nav"
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            aria-label={t("common.next", "Next")}
            title={t("common.next", "Next")}
          >
            <span aria-hidden="true">▶</span>
          </button>
        </>
      )}

      <form
        className="pager-jump"
        onSubmit={(e) => {
          e.preventDefault();
          goTo(Number(jumpValue));
        }}
      >
        <label htmlFor={jumpInputId} className="pager-jump-label">
          {t("common.jumpToPage", "Jump to page")}
        </label>
        <input
          id={jumpInputId}
          type="number"
          min="1"
          max={totalPages}
          value={jumpValue}
          onChange={(e) => setJumpValue(e.target.value)}
          className="pager-jump-input"
        />
        <button type="submit" className="pager-go-btn">
          {t("common.go", "Go")}
        </button>
      </form>
    </div>
  );
}
