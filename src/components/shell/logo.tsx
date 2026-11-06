import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Relay wordmark. Links to the role's home page. */
export function Logo({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-xl font-heading text-2xl font-semibold",
        className,
      )}
    >
      <span
        aria-hidden
        className="grid size-9 place-items-center rounded-xl bg-primary text-lg text-primary-foreground"
      >
        R
      </span>
      Relay
    </Link>
  );
}
