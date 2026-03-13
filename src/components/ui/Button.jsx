import "./Button.css";

/**
 * Primary UI button — single source of truth for all buttons in the app.
 *
 * Props:
 *   variant  – 'primary' | 'secondary' | 'muted' | 'danger' | 'ghost'  (default: 'primary')
 *   size     – 'md' | 'sm'                                               (default: 'md')
 *   loading  – boolean — shows spinner and disables the button
 *   icon     – boolean — renders a square icon-only button (no horizontal padding)
 *   className – additional classes merged in
 *
 * All native <button> props (type, onClick, disabled, aria-*, data-*, …) pass through.
 *
 * @example
 *   <Button onClick={save}>Save</Button>
 *   <Button variant="secondary" size="sm" onClick={cancel}>Cancel</Button>
 *   <Button variant="danger" loading={deleting}>Delete</Button>
 */
export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon = false,
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}) {
  const classes = [
    "btn",
    `btn--${variant}`,
    `btn--${size}`,
    loading ? "btn--loading" : "",
    icon ? "btn--icon" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="btn__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
