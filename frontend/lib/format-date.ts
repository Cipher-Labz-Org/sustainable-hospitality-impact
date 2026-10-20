/** Same output on server and client (avoids hydration mismatches from locale). */
export function formatDisplayDate(iso: string) {
  const day = iso.slice(0, 10);
  const [y, m, d] = day.split("-");
  if (!y || !m || !d) return iso;
  return `${Number(d)}/${Number(m)}/${y}`;
}
