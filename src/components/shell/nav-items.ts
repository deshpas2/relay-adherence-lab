import {
  ChartColumn,
  FlaskConical,
  House,
  type LucideIcon,
  Pill,
  ShieldCheck,
  Trophy,
  User,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/routes";

export type NavItem = {
  href: string;
  /** Key under "Nav" in src/messages/*.json */
  labelKey: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: Record<AppRole, NavItem[]> = {
  teen: [
    { href: "/teen/home", labelKey: "home", icon: House },
    { href: "/teen/meds", labelKey: "meds", icon: Pill },
    { href: "/teen/experiments", labelKey: "quests", icon: FlaskConical },
    { href: "/teen/profile", labelKey: "me", icon: User },
  ],
  parent: [
    { href: "/parent/home", labelKey: "confirm", icon: ShieldCheck },
    { href: "/parent/family", labelKey: "family", icon: Users },
  ],
  clinician: [
    { href: "/clinic/home", labelKey: "patients", icon: Users },
    { href: "/clinic/strategies", labelKey: "strategies", icon: Trophy },
    { href: "/clinic/overview", labelKey: "overview", icon: ChartColumn },
  ],
};
