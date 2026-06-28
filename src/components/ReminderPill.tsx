import { daysUntil, formatDate } from "@/lib/format";

// Shows the renewal/expiry date with an urgency-coloured pill.
// label defaults to relative wording ("om 12 dager" / "for 3 dager siden").
export function ReminderPill({
  date,
  showDate = true,
}: {
  date: Date | string | null | undefined;
  showDate?: boolean;
}) {
  const n = daysUntil(date);
  if (n == null) return <span className="muted">—</span>;

  let cls = "gray";
  let text: string;
  if (n < 0) {
    cls = "red";
    text = `Utløpt for ${Math.abs(n)} dager siden`;
  } else if (n === 0) {
    cls = "red";
    text = "I dag";
  } else if (n <= 30) {
    cls = "red";
    text = `Om ${n} dager`;
  } else if (n <= 60) {
    cls = "amber";
    text = `Om ${n} dager`;
  } else {
    cls = "green";
    text = `Om ${n} dager`;
  }

  return (
    <span>
      {showDate && <span>{formatDate(date)} </span>}
      <span className={`pill ${cls}`}>{text}</span>
    </span>
  );
}
