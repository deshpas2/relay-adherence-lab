"use client";

import { useEffect } from "react";

/**
 * Also puts data-app on <html>, so pop-ups (which render outside the
 * shell, at the end of <body>) get the same colors as the shell.
 */
export function HtmlAppAttr({ app }: { app: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-app", app);
    return () => root.removeAttribute("data-app");
  }, [app]);
  return null;
}
