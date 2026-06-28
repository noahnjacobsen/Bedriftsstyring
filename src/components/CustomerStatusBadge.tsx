import { customerStatusLabel } from "@/lib/crm";

export function CustomerStatusBadge({ status }: { status: string }) {
  return <span className={`badge ${status}`}>{customerStatusLabel(status)}</span>;
}
