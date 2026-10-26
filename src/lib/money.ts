const fmt = new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" });

export function formatCents(cents: number | null | undefined): string {
  return cents == null ? "–" : fmt.format(cents / 100);
}

/** "245", "245,50" oder "245.50" → Cent. */
export function parseEuroToCents(input: string): number | null {
  const t = input.trim().replace(/\s|€/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}
