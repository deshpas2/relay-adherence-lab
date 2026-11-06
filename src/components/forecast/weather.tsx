import { CloudFog, CloudLightning, CloudRain, CloudSun, Sun, type LucideIcon } from "lucide-react";
import type { Weather } from "@/lib/engine/forecast";
import { cn } from "@/lib/utils";

export type WeatherOrFog = Weather | "fog";

/** Icon + color for each weather. The word is always shown next to it elsewhere. */
export const WEATHER_STYLE: Record<WeatherOrFog, { icon: LucideIcon; color: string; soft: string }> = {
  sunny: { icon: Sun, color: "var(--warning)", soft: "var(--warning-soft)" },
  cloudy: { icon: CloudSun, color: "var(--success)", soft: "var(--secondary)" },
  rainy: { icon: CloudRain, color: "var(--cyan-strong)", soft: "var(--accent)" },
  stormy: { icon: CloudLightning, color: "var(--primary-foreground)", soft: "var(--primary)" },
  fog: { icon: CloudFog, color: "var(--muted-foreground)", soft: "var(--muted)" },
};

/** Weather icon in a soft circle, with its word beside it. */
export function WeatherBadge({ weather, label, className }: { weather: WeatherOrFog; label: string; className?: string }) {
  const { icon: Icon, color, soft } = WEATHER_STYLE[weather];
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold", className)}>
      <span className="grid size-8 place-items-center rounded-full" style={{ background: soft, color }}>
        <Icon aria-hidden className="size-4.5" />
      </span>
      {label}
    </span>
  );
}
