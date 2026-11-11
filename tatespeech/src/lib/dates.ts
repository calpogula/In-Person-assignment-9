export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

export function displayStreak(streak: number, lastDate: string | null, today: string): number {
  if (!lastDate || streak <= 0) return 0;
  if (lastDate === today || lastDate === addIsoDays(today, -1)) return streak;
  return 0;
}

export function nextStreak(streak: number, lastDate: string | null, today: string): number {
  if (!lastDate) return 1;
  if (lastDate === today) return streak > 0 ? streak : 1;
  if (lastDate === addIsoDays(today, -1)) return streak + 1;
  return 1;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
