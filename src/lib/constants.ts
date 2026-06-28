// Central place for the configurable contract types and statuses.
// Values are stored in the DB; labels are the Norwegian UI text.

export const CONTRACT_TYPES = [
  { value: "kundeavtale", label: "Kundeavtale" },
  { value: "ansettelseskontrakt", label: "Ansettelseskontrakt" },
  { value: "eieravtale", label: "Eier-/gründeravtale" },
  { value: "leverandoravtale", label: "Leverandøravtale" },
] as const;

export const STATUSES = [
  { value: "utkast", label: "Utkast" },
  { value: "sendt", label: "Sendt" },
  { value: "signert", label: "Signert" },
  { value: "aktiv", label: "Aktiv" },
  { value: "utlopt", label: "Utløpt" },
  { value: "avsluttet", label: "Avsluttet/oppsagt" },
] as const;

// Price units shown in the amount dropdown.
export const AMOUNT_UNITS = [
  "per oppdrag",
  "per måned",
  "per år",
  "engang",
  "fastpris",
] as const;

export type ContractTypeValue = (typeof CONTRACT_TYPES)[number]["value"];
export type StatusValue = (typeof STATUSES)[number]["value"];

export function typeLabel(value: string): string {
  return CONTRACT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function statusLabel(value: string): string {
  return STATUSES.find((s) => s.value === value)?.label ?? value;
}
