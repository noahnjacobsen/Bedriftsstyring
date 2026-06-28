"use client";

import { CONTRACT_TYPES, STATUSES, AMOUNT_UNITS } from "@/lib/constants";
import { toInputDate } from "@/lib/format";

export type ContractInitial = {
  title?: string;
  type?: string;
  status?: string;
  counterpartyName?: string;
  counterpartyPhone?: string | null;
  counterpartyEmail?: string | null;
  counterpartyAddress?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  signedDate?: Date | string | null;
  amount?: number | null;
  amountUnit?: string | null;
  autoRenew?: boolean;
  notes?: string | null;
  customerId?: number | null;
};

export function ContractForm({
  action,
  initial = {},
  submitLabel = "Lagre",
  cancelHref,
  customers = [],
}: {
  action: (formData: FormData) => void;
  initial?: ContractInitial;
  submitLabel?: string;
  cancelHref: string;
  customers?: { id: number; name: string }[];
}) {
  const units = Array.from(
    new Set([...AMOUNT_UNITS, ...(initial.amountUnit ? [initial.amountUnit] : [])]),
  );

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
            placeholder="F.eks. Fast avtale – plenklipping"
          />
        </div>

        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={initial.type ?? "kundeavtale"}>
            {CONTRACT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={initial.status ?? "utkast"}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {customers.length > 0 && (
          <div className="field full">
            <label htmlFor="customerId">Kunde (CRM)</label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={initial.customerId != null ? String(initial.customerId) : ""}
            >
              <option value="">— Ikke knyttet —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field full">
          <label htmlFor="counterpartyName">Motpart (navn) *</label>
          <input
            id="counterpartyName"
            name="counterpartyName"
            type="text"
            required
            defaultValue={initial.counterpartyName ?? ""}
            placeholder="Kundens eller motpartens navn"
          />
        </div>

        <div className="field">
          <label htmlFor="counterpartyPhone">Telefon</label>
          <input
            id="counterpartyPhone"
            name="counterpartyPhone"
            type="tel"
            defaultValue={initial.counterpartyPhone ?? ""}
            placeholder="400 00 000"
          />
        </div>

        <div className="field">
          <label htmlFor="counterpartyEmail">E-post</label>
          <input
            id="counterpartyEmail"
            name="counterpartyEmail"
            type="email"
            defaultValue={initial.counterpartyEmail ?? ""}
            placeholder="navn@example.no"
          />
        </div>

        <div className="field full">
          <label htmlFor="counterpartyAddress">Adresse</label>
          <input
            id="counterpartyAddress"
            name="counterpartyAddress"
            type="text"
            defaultValue={initial.counterpartyAddress ?? ""}
            placeholder="Gate, postnr. sted"
          />
        </div>

        <div className="field">
          <label htmlFor="startDate">Startdato</label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toInputDate(initial.startDate)}
          />
        </div>

        <div className="field">
          <label htmlFor="endDate">Slutt-/fornyelsesdato</label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toInputDate(initial.endDate)}
          />
        </div>

        <div className="field">
          <label htmlFor="amount">Beløp / pris (kr)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="1"
            min="0"
            defaultValue={initial.amount ?? ""}
            placeholder="0"
          />
        </div>

        <div className="field">
          <label htmlFor="amountUnit">Prisenhet</label>
          <select
            id="amountUnit"
            name="amountUnit"
            defaultValue={initial.amountUnit ?? ""}
          >
            <option value="">—</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="signedDate">Signeringsdato</label>
          <input
            id="signedDate"
            name="signedDate"
            type="date"
            defaultValue={toInputDate(initial.signedDate)}
          />
        </div>

        <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
          <div className="checkbox" style={{ paddingBottom: "0.6rem" }}>
            <input
              id="autoRenew"
              name="autoRenew"
              type="checkbox"
              defaultChecked={initial.autoRenew ?? false}
            />
            <label htmlFor="autoRenew">Fornyes automatisk (sesong/abonnement)</label>
          </div>
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
