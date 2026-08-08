"use client";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        all: "unset",
        cursor: "pointer",
        width: 52,
        height: 28,
        flex: "none",
        background: checked ? "var(--color-accent)" : "var(--color-neutral-300)",
        display: "flex",
        alignItems: "center",
        justifyContent: checked ? "flex-end" : "flex-start",
        padding: "0 3px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: 22, height: 22, background: "#f3f2f2" }} />
    </button>
  );
}
