import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info" | "warning";
type ToastItem = {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
};

type ToastAPI = {
  success: (msg: string, duration?: number) => void;
  error: (msg: string, duration?: number) => void;
  info: (msg: string, duration?: number) => void;
  warning: (msg: string, duration?: number) => void;
};

const ToastCtx = createContext<ToastAPI | null>(null);

const viewportStyle: React.CSSProperties = {
  position: "fixed",
  top: 16,
  right: 16,
  display: "grid",
  gap: 10,
  // 比你的 loading overlay(9999) 還高，非常高
  zIndex: 2147483647,
};

const baseStyle: React.CSSProperties = {
  minWidth: 240,
  maxWidth: 420,
  padding: "10px 14px",
  borderRadius: 10,
  boxShadow: "0 8px 24px rgba(0,0,0,.18)",
  color: "#fff",
  fontWeight: 700,
  letterSpacing: ".02em",
  lineHeight: 1.35,
};

const colorByType: Record<ToastType, string> = {
  success: "#16a34a",
  error: "#dc2626",
  info: "#2563eb",
  warning: "#d97706",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, message, duration }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const api = useMemo<ToastAPI>(
    () => ({
      success: (m, d) => push("success", m, d),
      error: (m, d) => push("error", m, d),
      info: (m, d) => push("info", m, d),
      warning: (m, d) => push("warning", m, d),
    }),
    [push],
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div style={viewportStyle}>
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{ ...baseStyle, background: colorByType[t.type] }}
            >
              {t.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastAPI {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
