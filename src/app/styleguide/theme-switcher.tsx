"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Dev-only: previews the clinician colors. In the real app each role's
 * AppShell sets data-app. Theme, contrast and text size live in A11yMenu.
 */
export function AppSwitcher() {
  const [app, setApp] = useState<"teen" | "clinic">("teen");

  function choose(next: "teen" | "clinic") {
    const root = document.documentElement;
    if (next === "clinic") root.setAttribute("data-app", "clinic");
    else root.removeAttribute("data-app");
    setApp(next);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">App</span>
      {(["teen", "clinic"] as const).map((v) => (
        <Button
          key={v}
          size="sm"
          variant={app === v ? "default" : "outline"}
          aria-pressed={app === v}
          onClick={() => choose(v)}
        >
          {v}
        </Button>
      ))}
    </div>
  );
}
