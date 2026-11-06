"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/routes";
import { NAV_ITEMS } from "./nav-items";

type ShellNavProps = {
  role: AppRole;
  /** Translated labels, keyed by NavItem.labelKey. */
  labels: Record<string, string>;
  /** "tab" = icon over label (phone bottom bar); "row" = icon beside label. */
  variant: "tab" | "row";
};

/**
 * The role's nav links. Each link highlights itself on its own page
 * (and sub-pages). Client-side because it reads the current URL.
 */
export function ShellNavLinks({ role, labels, variant }: ShellNavProps) {
  const pathname = usePathname();

  return NAV_ITEMS[role].map(({ href, labelKey, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex shrink-0 items-center rounded-xl font-medium transition-colors",
          variant === "tab" &&
            "min-h-14 flex-col justify-center gap-0.5 px-2 text-xs",
          variant === "row" && "min-h-11 gap-3 px-3 text-base",
          active
            ? variant === "tab"
              ? "text-primary"
              : "bg-secondary text-secondary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "grid place-items-center rounded-full transition-colors",
            variant === "tab" && "h-7 w-12",
            variant === "tab" && active && "bg-secondary",
          )}
        >
          <Icon aria-hidden className="size-5" strokeWidth={active ? 2.5 : 2} />
        </span>
        {labels[labelKey]}
      </Link>
    );
  });
}
