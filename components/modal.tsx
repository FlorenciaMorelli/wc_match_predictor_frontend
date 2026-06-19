"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
  labelledBy?: string;
}

export default function Modal({
  open,
  onClose,
  header,
  children,
  labelledBy,
}: Props) {
  const { t } = useLanguage();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open]);

  function handleClose() {
    onClose();
  }

  function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === ref.current) onClose();
  }

  return (
    <dialog
      ref={ref}
      onCancel={handleClose}
      onClose={handleClose}
      onClick={handleClick}
      aria-labelledby={labelledBy}
      className="border-line bg-surface m-auto max-h-[90vh] w-[min(92vw,42rem)] overflow-hidden rounded-2xl border p-0 shadow-xl backdrop:cursor-pointer"
    >
      {/* Wrapper flex: el <dialog> no debe tener display:flex porque aplasta el
          dialog:not([open]){display:none} del UA stylesheet del navegador. */}
      <div className="flex max-h-[90vh] flex-col">
        <div className="border-line bg-surface/95 flex shrink-0 items-start justify-between gap-4 border-b px-6 py-4 backdrop-blur-sm">
          <div className="min-w-0">{header}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.modal.close}
            className="text-ink-muted hover:bg-canvas hover:text-ink focus-visible:ring-brand shrink-0 rounded-full p-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X size={18} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </dialog>
  );
}
