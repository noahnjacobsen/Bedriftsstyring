// CRM vocabulary. Values are stored in the DB; labels are the Norwegian UI text.

export const CUSTOMER_TYPES = [
  { value: "privat", label: "Privatperson" },
  { value: "bedrift", label: "Bedrift" },
  { value: "borettslag", label: "Borettslag" },
  { value: "sameie", label: "Sameie" },
  { value: "annet", label: "Annet" },
] as const;

export const CUSTOMER_STATUSES = [
  { value: "prospekt", label: "Prospekt" },
  { value: "aktiv", label: "Aktiv kunde" },
  { value: "inaktiv", label: "Inaktiv" },
] as const;

export const ACTIVITY_TYPES = [
  { value: "samtale", label: "Samtale", icon: "📞" },
  { value: "epost", label: "E-post", icon: "✉️" },
  { value: "mote", label: "Møte", icon: "🤝" },
  { value: "notat", label: "Notat", icon: "📝" },
  { value: "oppgave", label: "Oppgave", icon: "✅" },
] as const;

export function customerTypeLabel(value: string): string {
  return CUSTOMER_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function customerStatusLabel(value: string): string {
  return CUSTOMER_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function activityTypeLabel(value: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function activityTypeIcon(value: string): string {
  return ACTIVITY_TYPES.find((t) => t.value === value)?.icon ?? "•";
}
