"use client";

import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { create } from "zustand";
import { buzz } from "@/components/a11y/prefs-store";
import { cn } from "@/lib/utils";

type Toast = { id: number; text: string; tone: "xp" | "info" };

type ToastState = {
  toasts: Toast[];
  show: (text: string, tone?: Toast["tone"]) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: (text, tone = "info") => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }].slice(-3) }));
    if (tone === "xp") buzz(40);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Shows a short message at the top of the screen, e.g. "+10 XP". */
export function toast(text: string, tone?: Toast["tone"]) {
  useToasts.getState().show(text, tone);
}

/** Put once near the top of the app. Screen readers hear each message. */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+0.75rem)] z-[60] flex flex-col items-center gap-2 px-4"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-full px-5 py-3 font-semibold shadow-lg animate-in fade-in slide-in-from-top-4",
        toast.tone === "xp" ? "bg-xp text-xp-foreground" : "bg-foreground text-background",
      )}
    >
      {toast.tone === "xp" && <Sparkles aria-hidden className="size-5" />}
      {toast.text}
    </div>
  );
}
