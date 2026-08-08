"use client";

import type { ReactNode } from "react";

export function DialogBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="dialog-backdrop">
      <div className="dialog">{children}</div>
    </div>
  );
}

export function DialogContent({ children }: { children: ReactNode }) {
  return <div className="dialog-content">{children}</div>;
}

export function DialogKicker({ children }: { children: ReactNode }) {
  return <div className="dialog-kicker">{children}</div>;
}

export function DialogTitle({ children }: { children: ReactNode }) {
  return <div className="dialog-title">{children}</div>;
}

export function DialogBody({ children }: { children: ReactNode }) {
  return <p className="dialog-body">{children}</p>;
}

export function DialogActions({ children }: { children: ReactNode }) {
  return <div className="dialog-actions">{children}</div>;
}
