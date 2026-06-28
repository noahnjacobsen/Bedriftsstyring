"use client";

import {
  DOMAINS,
  CONTROL_CATEGORIES,
  CONTROL_STATUSES,
  RISK_LEVELS,
} from "@/lib/security";
import { toInputDate } from "@/lib/format";

export type ControlInitial = {
  title?: string;
  domain?: string;
  category?: string;
  status?: string;
  riskLevel?: string;
  description?: string | null;
  owner?: string | null;
  reviewDate?: Date | string | null;
  notes?: string | null;
};

export function ControlForm({
  action,
  initial = {},
  submitLabel = "Lagre",
  cancelHref,
}: {
  action: (formData: FormData) => void;
  initial?: ControlInitial;
  submitLabel?: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="card">
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="title">Tittel *</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={initial.title ?? ""}
            placeholder="F.eks. To-faktor på e-post"
          />
        </div>

        <div className="field">
          <label htmlFor="domain">Område</label>
          <select id="domain" name="domain" defaultValue={initial.domain ?? "it_sikkerhet"}>
            {DOMAINS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.icon} {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="category">Kategori</label>
          <select id="category" name="category" defaultValue={initial.category ?? "tilgangsstyring"}>
            {DOMAINS.map((d) => (
              <optgroup key={d.value} label={d.label}>
                {CONTROL_CATEGORIES.filter((c) => c.domain === d.value).map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial.status ?? "ikke_startet"}>
            {CONTROL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="riskLevel">Risikonivå</label>
          <select id="riskLevel" name="riskLevel" defaultValue={initial.riskLevel ?? "middels"}>
            {RISK_LEVELS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="owner">Ansvarlig</label>
          <input
            id="owner"
            name="owner"
            type="text"
            defaultValue={initial.owner ?? ""}
            placeholder="F.eks. Eier 1"
          />
        </div>

        <div className="field">
          <label htmlFor="reviewDate">Frist / neste gjennomgang</label>
          <input
            id="reviewDate"
            name="reviewDate"
            type="date"
            defaultValue={toInputDate(initial.reviewDate)}
          />
        </div>

        <div className="field full">
          <label htmlFor="description">Beskrivelse</label>
          <textarea id="description" name="description" defaultValue={initial.description ?? ""} />
        </div>

        <div className="field full">
          <label htmlFor="notes">Notater</label>
          <textarea id="notes" name="notes" defaultValue={initial.notes ?? ""} />
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn">
          {submitLabel}
        </button>
        <a href={cancelHref} className="btn secondary">
          Avbryt
        </a>
      </div>
    </form>
  );
}
