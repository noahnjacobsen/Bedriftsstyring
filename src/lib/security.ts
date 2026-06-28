// Vocabulary for the Sikkerhet & etterlevelse module.
// Values are stored in the DB; labels are the Norwegian UI text.

export const DOMAINS = [
  { value: "it_sikkerhet", label: "IT-sikkerhet & personvern", icon: "🔐" },
  { value: "drift_hms", label: "Drift, HMS & kontrakter", icon: "🦺" },
] as const;

// The AI assessment also allows "begge".
export const ASSESSMENT_DOMAINS = [
  ...DOMAINS,
  { value: "begge", label: "Begge områder", icon: "🧭" },
] as const;

export const CONTROL_CATEGORIES = [
  { value: "tilgangsstyring", label: "Tilgangsstyring & passord", domain: "it_sikkerhet" },
  { value: "personvern", label: "Personvern / GDPR", domain: "it_sikkerhet" },
  { value: "databehandling", label: "Databehandleravtaler", domain: "it_sikkerhet" },
  { value: "sikkerhetskopi", label: "Sikkerhetskopi & gjenoppretting", domain: "it_sikkerhet" },
  { value: "avvik", label: "Avvik & hendelser", domain: "it_sikkerhet" },
  { value: "hms", label: "HMS / arbeidsmiljø", domain: "drift_hms" },
  { value: "forsikring", label: "Forsikring & ansvar", domain: "drift_hms" },
  { value: "ansettelse", label: "Ansettelse & arbeidsavtaler", domain: "drift_hms" },
  { value: "kundekontrakt", label: "Kundekontrakter & vilkår", domain: "drift_hms" },
  { value: "utstyr", label: "Utstyr & kjøretøy", domain: "drift_hms" },
  { value: "annet", label: "Annet", domain: "drift_hms" },
] as const;

export const CONTROL_STATUSES = [
  { value: "ikke_startet", label: "Ikke startet" },
  { value: "paagaar", label: "Pågår" },
  { value: "paa_plass", label: "På plass" },
  { value: "trenger_oppfolging", label: "Trenger oppfølging" },
  { value: "utlopt", label: "Utløpt" },
] as const;

export const RISK_LEVELS = [
  { value: "lav", label: "Lav" },
  { value: "middels", label: "Middels" },
  { value: "hoy", label: "Høy" },
] as const;

export function domainLabel(value: string): string {
  return ASSESSMENT_DOMAINS.find((d) => d.value === value)?.label ?? value;
}
export function domainIcon(value: string): string {
  return ASSESSMENT_DOMAINS.find((d) => d.value === value)?.icon ?? "•";
}
export function categoryLabel(value: string): string {
  return CONTROL_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
export function controlStatusLabel(value: string): string {
  return CONTROL_STATUSES.find((s) => s.value === value)?.label ?? value;
}
export function riskLabel(value: string): string {
  return RISK_LEVELS.find((r) => r.value === value)?.label ?? value;
}
