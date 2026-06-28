import { controlStatusLabel, riskLabel } from "@/lib/security";

// Status pill for a control item. Reuses the global .badge.<status> classes.
export function ControlStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{controlStatusLabel(status)}</span>;
}

// Risk-level pill (lav/middels/hoy).
export function RiskBadge({ level }: { level: string }) {
  return <span className={`risk risk-${level}`}>{riskLabel(level)}</span>;
}
