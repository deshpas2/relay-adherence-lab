/**
 * Level maths for display: level = floor(sqrt(xp / 50)) + 1 (Section 6.5).
 * TODO(lane-be merge): replace with levelProgress() from src/lib/engine/game.ts,
 * which returns the same fields. The server stays the source of truth for XP.
 */
const STEP = 50;

const xpForLevel = (level: number) => STEP * (level - 1) ** 2;

export function levelProgress(xp: number) {
  const level = xp > 0 ? Math.floor(Math.sqrt(xp / STEP)) + 1 : 1;
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    xpIntoLevel: xp - start,
    xpToNext: next - xp,
    levelSize: next - start,
  };
}

/** "07:30" -> "7:30 AM" (or "7:30" in Spanish), the same on server and phone. */
export function formatClock(time: string, locale: string) {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}
