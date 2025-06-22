"use client";
import * as React from "react";
import type { ReactNode } from "react";
import {
    ToastProvider as RadixToastProvider,
    ToastViewport,
    Toast,
    ToastTitle,
    ToastDescription,
    ToastAction,
    ToastClose,
} from "@radix-ui/react-toast";

interface ToastOptions {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "success" | "error" | "info";
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastOptions | null>(null);

  const showToast = React.useCallback((options: ToastOptions) => {
    setToast(options);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <RadixToastProvider duration={toast?.duration || 4000} swipeDirection="right">
        {children}
        <Toast open={open} onOpenChange={setOpen} className={
          toast?.variant === "success"
            ? "bg-green-50 border-green-200 text-green-900"
            : toast?.variant === "error"
            ? "bg-red-50 border-red-200 text-red-900"
            : "bg-white border-gray-200 text-gray-900"
        }>
          <ToastTitle>{toast?.title}</ToastTitle>
          {toast?.description && <ToastDescription>{toast.description}</ToastDescription>}
          {toast?.actionLabel && toast?.onAction && (
            <ToastAction altText={toast.actionLabel} onClick={toast.onAction}>
              {toast.actionLabel}
            </ToastAction>
          )}
          <ToastClose />
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 z-50 w-96 max-w-full outline-none" />
      </RadixToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
} 