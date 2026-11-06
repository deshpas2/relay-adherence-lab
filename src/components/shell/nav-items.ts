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
    { href: "/home", labelKey: "home", icon: House },
    { href: "/meds", labelKey: "meds", icon: Pill },
    { href: "/experiments", labelKey: "quests", icon: FlaskConical },
    { href: "/profile", labelKey: "me", icon: User },
  ],
  parent: [
    { href: "/confirm", labelKey: "confirm", icon: ShieldCheck },
    { href: "/family", labelKey: "family", icon: Users },
  ],
  clinician: [
    { href: "/patients", labelKey: "patients", icon: Users },
    { href: "/strategies", labelKey: "strategies", icon: Trophy },
    { href: "/overview", labelKey: "overview", icon: ChartColumn },
  ],
};
