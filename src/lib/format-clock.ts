/** "07:30" -> "7:30 AM" (or "7:30" in Spanish), the same on server and phone. */
export function formatClock(time: string, locale: string) {
  const [h, m] = time.split(":").map(Number);
  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2000, 0, 1, h, m)));
}
