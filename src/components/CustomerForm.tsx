"use client";

import { CUSTOMER_TYPES, CUSTOMER_STATUSES } from "@/lib/crm";

export type CustomerInitial = {
  name?: string;
  type?: string;
  status?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export function CustomerForm({
  action,
  initial = {},
  submitLabel = "Lagre",
  cancelHref,
}: {
  action: (formData: FormData) => void;
  initial?: CustomerInitial;
  submitLabel?: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="card">
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="name">Navn *</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initial.name ?? ""}
            placeholder="Kundens navn / firmanavn"
          />
        </div>

        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={initial.type ?? "privat"}>
            {CUSTOMER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial.status ?? "prospekt"}>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="phone">Telefon</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initial.phone ?? ""}
            placeholder="400 00 000"
          />
        </div>

        <div className="field">
          <label htmlFor="email">E-post</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={initial.email ?? ""}
            placeholder="navn@example.no"
          />
        </div>

        <div className="field full">
          <label htmlFor="address">Adresse</label>
          <input
            id="address"
            name="address"
            type="text"
            defaultValue={initial.address ?? ""}
            placeholder="Gate, postnr. sted"
          />
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
