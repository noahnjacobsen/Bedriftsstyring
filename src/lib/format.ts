// Norwegian-locale formatting helpers and small date utilities.

const dateFmt = new Intl.DateTimeFormat("nb-NO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const currencyFmt = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatMoney(
  amount: number | null | undefined,
  unit?: string | null,
): string {
  if (amount == null) return "—";
  const base = currencyFmt.format(amount);
  return unit ? `${base} ${unit}` : base;
}

// Value for an <input type="date"> (YYYY-MM-DD), in local time.
export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Whole days from today until the given date (negative = in the past).
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

// Human-friendly "om 12 dager" / "for 3 dager siden" / "i dag".
export function relativeDays(date: Date | string | null | undefined): string {
  const n = daysUntil(date);
  if (n == null) return "";
  if (n === 0) return "i dag";
  if (n > 0) return `om ${n} ${n === 1 ? "dag" : "dager"}`;
  const a = Math.abs(n);
  return `for ${a} ${a === 1 ? "dag" : "dager"} siden`;
}
