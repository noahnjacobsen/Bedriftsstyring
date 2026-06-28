import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { typeLabel } from "@/lib/constants";
import {
  customerTypeLabel,
  activityTypeLabel,
  activityTypeIcon,
  ACTIVITY_TYPES,
} from "@/lib/crm";
import { formatDate, formatMoney, toInputDate, relativeDays } from "@/lib/format";
import {
  deleteCustomer,
  logActivity,
  toggleActivityDone,
  deleteActivity,
} from "@/lib/crm-actions";
import { CustomerStatusBadge } from "@/components/CustomerStatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ReminderPill } from "@/components/ReminderPill";
import { DeleteButton } from "@/components/DeleteButton";
import { ToggleDoneButton, DeleteActivityButton } from "@/components/ActivityActions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: {
      contracts: { orderBy: { updatedAt: "desc" } },
      activities: { orderBy: [{ date: "desc" }, { id: "desc" }] },
    },
  });
  if (!customer) notFound();

  const del = deleteCustomer.bind(null, customerId);
  const log = logActivity.bind(null, customerId);
  const todayInput = toInputDate(new Date());

  const openFollowUps = customer.activities.filter((a) => a.followUpAt && !a.done);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{customer.name}</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <CustomerStatusBadge status={customer.status} />
            <span className="muted small">{customerTypeLabel(customer.type)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href="/kunder" className="btn secondary">
            ← Tilbake
          </a>
          <a href={`/kunder/${customerId}/rediger`} className="btn">
            Rediger
          </a>
        </div>
      </div>

      {/* Contact */}
      <div className="card">
        <h2>Kontaktinfo</h2>
        <div className="detail-grid">
          <div>
            <div className="label">Telefon</div>
            <div className="value">
              {customer.phone ? <a href={`tel:${customer.phone}`}>{customer.phone}</a> : "—"}
            </div>
          </div>
          <div>
            <div className="label">E-post</div>
            <div className="value">
              {customer.email ? (
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <div className="label">Adresse</div>
            <div className="value">{customer.address ?? "—"}</div>
          </div>
        </div>
        {customer.notes && (
          <>
            <div className="label" style={{ marginTop: "1rem" }}>
              Notater
            </div>
            <div className="value" style={{ whiteSpace: "pre-wrap" }}>
              {customer.notes}
            </div>
          </>
        )}
      </div>

      {/* Open follow-ups highlight */}
      {openFollowUps.length > 0 && (
        <div className="card">
          <h2>🔔 Åpne oppfølginger</h2>
          <ul className="timeline">
            {openFollowUps.map((a) => {
              const toggle = toggleActivityDone.bind(null, a.id, customerId);
              return (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {activityTypeIcon(a.type)} {a.summary}
                  </span>
                  <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", whiteSpace: "nowrap" }}>
                    <ReminderPill date={a.followUpAt} />
                    <ToggleDoneButton action={toggle} done={a.done} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Contracts */}
      <div className="card">
        <div className="section-title" style={{ margin: 0 }}>
          <h2 style={{ margin: 0 }}>Kontrakter ({customer.contracts.length})</h2>
          <a href={`/kontrakter/ny?customerId=${customerId}`} className="btn secondary small">
            + Ny kontrakt
          </a>
        </div>
        {customer.contracts.length === 0 ? (
          <p className="muted small">Ingen kontrakter knyttet til kunden ennå.</p>
        ) : (
          <ul className="timeline">
            {customer.contracts.map((c) => (
              <li
                key={c.id}
                style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}
              >
                <span>
                  <a href={`/kontrakter/${c.id}`}>
                    <strong>{c.title}</strong>
                  </a>{" "}
                  <span className="muted small">· {typeLabel(c.type)}</span>
                </span>
                <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", whiteSpace: "nowrap" }}>
                  <span className="small muted">{formatMoney(c.amount, c.amountUnit)}</span>
                  <StatusBadge status={c.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Log a new activity */}
      <div className="card">
        <h2>Loggfør aktivitet</h2>
        <form action={log}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="type">Type</label>
              <select id="type" name="type" defaultValue="samtale">
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">Dato</label>
              <input id="date" name="date" type="date" defaultValue={todayInput} />
            </div>
            <div className="field full">
              <label htmlFor="summary">Hva skjedde? *</label>
              <input
                id="summary"
                name="summary"
                type="text"
                required
                placeholder="F.eks. Ringte om ny sesong – ønsker tilbud"
              />
            </div>
            <div className="field">
              <label htmlFor="followUpAt">Oppfølgingsdato (valgfritt)</label>
              <input id="followUpAt" name="followUpAt" type="date" />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn">
              Loggfør
            </button>
          </div>
        </form>
      </div>

      {/* Activity history */}
      <div className="card">
        <h2>Historikk</h2>
        {customer.activities.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            Ingen aktivitet loggført ennå.
          </p>
        ) : (
          <ul className="timeline">
            {customer.activities.map((a) => {
              const toggle = toggleActivityDone.bind(null, a.id, customerId);
              const remove = deleteActivity.bind(null, a.id, customerId);
              return (
                <li key={a.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "baseline" }}>
                    <span style={a.done ? { opacity: 0.6 } : undefined}>
                      <strong>
                        {activityTypeIcon(a.type)} {activityTypeLabel(a.type)}
                      </strong>{" "}
                      — {a.summary}
                    </span>
                    <span className="muted small" style={{ whiteSpace: "nowrap" }}>
                      {formatDate(a.date)}
                      {a.actor ? ` · ${a.actor}` : ""}
                    </span>
                  </div>
                  {a.followUpAt && (
                    <div className="small" style={{ marginTop: "0.25rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                      <span className="muted">Oppfølging:</span>
                      {a.done ? (
                        <span className="pill green">Utført</span>
                      ) : (
                        <ReminderPill date={a.followUpAt} />
                      )}
                      <ToggleDoneButton action={toggle} done={a.done} />
                      <DeleteActivityButton action={remove} />
                    </div>
                  )}
                  {!a.followUpAt && (
                    <div className="small" style={{ marginTop: "0.25rem" }}>
                      <DeleteActivityButton action={remove} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Faresone</h3>
        <p className="muted small" style={{ marginTop: 0 }}>
          Sletter kunden og all aktivitet. Kontrakter beholdes, men kobles fra kunden.
        </p>
        <DeleteButton
          action={del}
          label="Slett kunde"
          confirmText="Slette denne kunden og all aktivitet? Kontrakter beholdes, men mister koblingen."
        />
      </div>
    </>
  );
}
