/* frontend/src/components/ui/Modal.tsx */
"use client";
import React, { ReactNode } from "react";

export function Modal({
  open, title, children, footer, onClose
}: { open: boolean; title: string; children: ReactNode; footer?: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <span>{title}</span>
          <button aria-label="Close" className="btn ghost" onClick={onClose}>×</button>
        </header>
        <section>{children}</section>
        {footer ? <footer>{footer}</footer> : null}
      </div>
    </div>
  );
}
