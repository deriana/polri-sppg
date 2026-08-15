// Shared helper — inclusive list of YYYY-MM-DD strings from startISO to endISO.
export function dateRange(startISO: string, endISO: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startISO);
  const end = new Date(endISO);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}
