import React from "react";

function BaseIcon({ children, size = 18, className = "", title }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden={title ? undefined : "true"}
      role={title ? "img" : "presentation"}
      focusable="false"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function ShoppingIcon(props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M3 6h2l1.2 8.2A2 2 0 0 0 8.2 16h8.9a2 2 0 0 0 1.96-1.6L20 8H6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="19" r="1.6" fill="currentColor" />
      <circle cx="17" cy="19" r="1.6" fill="currentColor" />
      <path
        d="M8.2 16H18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9 6.5 10.3 3m3.2 3.5L14.8 3m-8.2 3.5h9.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </BaseIcon>
  );
}

export function HomeIcon(props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M4 10.5 12 4l8 6.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.8V19a1 1 0 0 0 1 1H11v-5.2a.8.8 0 0 1 .8-.8h.4a.8.8 0 0 1 .8.8V20h3.5a1 1 0 0 0 1-1V9.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseIcon>
  );
}

export function TodoIcon(props) {
  return (
    <BaseIcon {...props}>
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="2.6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 4.2h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.2 9.8 9.6 11.2l2.4-2.8M8.2 14.8l1.4 1.4 2.4-2.8M14.3 9.8H16.8M14.3 14.8H16.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </BaseIcon>
  );
}

export function EventIcon(props) {
  return (
    <BaseIcon {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M4 9h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="7"
        y="11.5"
        width="3.2"
        height="3.2"
        rx="0.8"
        fill="currentColor"
      />
      <rect
        x="11.4"
        y="11.5"
        width="3.2"
        height="3.2"
        rx="0.8"
        fill="currentColor"
        opacity="0.75"
      />
      <rect
        x="15.8"
        y="11.5"
        width="1.2"
        height="1.2"
        rx="0.3"
        fill="currentColor"
        opacity="0.55"
      />
    </BaseIcon>
  );
}

export function NotesIcon(props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M7 3h7l4 4v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v4h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 11h7M8.5 14h7M8.5 17h4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="7.3" cy="11" r="0.8" fill="currentColor" />
      <circle cx="7.3" cy="14" r="0.8" fill="currentColor" />
      <circle cx="7.3" cy="17" r="0.8" fill="currentColor" />
    </BaseIcon>
  );
}

export function MapIcon(props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M5 6.5 9 5l6 2.5 4-1.5v12.5l-4 1.5-6-2.5-4 1.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 5v12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M15 7.5v12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 8.5c-1.5 0-2.7 1.2-2.7 2.7 0 2.2 2.7 5.1 2.7 5.1s2.7-2.9 2.7-5.1c0-1.5-1.2-2.7-2.7-2.7z"
        fill="currentColor"
      />
      <circle cx="12" cy="11.1" r="0.8" fill="#fff" />
    </BaseIcon>
  );
}

export function UsersIcon(props) {
  return (
    <BaseIcon {...props}>
      <circle cx="9" cy="8.25" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M4.8 19c.7-3 3-5 5.2-5s4.5 2 5.2 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.5"
        cy="9.2"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M13.8 18.4c.45-2.08 1.9-3.55 3.6-3.55 1.44 0 2.75.9 3.4 2.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </BaseIcon>
  );
}

export function WishIcon(props) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 4.2 13.6 8l3.8 1.6-3.8 1.6L12 15l-1.6-3.8L6.6 9.6 10.4 8 12 4.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M18.2 4.8 19 6.7l1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9zM6 15.8l1 2.3 2.3 1-2.3 1-1 2.3-1-2.3-2.3-1 2.3-1 1-2.3z"
        fill="currentColor"
      />
    </BaseIcon>
  );
}

export function SettingsIcon(props) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M17.8 6.2l-1.5 1.5M7.7 16.3l-1.5 1.5M17.8 17.8l-1.5-1.5M7.7 7.7 6.2 6.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </BaseIcon>
  );
}
