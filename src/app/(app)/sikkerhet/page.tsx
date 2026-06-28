import { prisma } from "@/lib/db";
import {
  DOMAINS,
  CONTROL_STATUSES,
  RISK_LEVELS,
  domainLabel,
  domainIcon,
  categoryLabel,
} from "@/lib/security";
import { formatDate } from "@/lib/format";
import { ReminderPill } from "@/components/ReminderPill";
import { ControlStatusBadge, RiskBadge } from "@/components/SecurityBadges";
import type { Prisma } from "@prisma/client";

type Search = { q?: string; domain?: string; status?: string; risk?: string };

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const domain = sp.domain ?? "";
  const status = sp.status ?? "";
  const risk = sp.risk ?? "";

  const and: Prisma.ControlItemWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { owner: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (domain) and.push({ domain });
  if (status) and.push({ status });
  if (risk) and.push({ riskLevel: risk });

  const items = await prisma.controlItem.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ reviewDate: "asc" }, { updatedAt: "desc" }],
  });

  const hasFilters = Boolean(q || domain || status || risk);

  return (
    <>
      <div className="page-head">
        <h1>Sikkerhet & etterlevelse</h1>
        <a href="/sikkerhet/ny" className="btn">
          + Nytt punkt
        </a>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Register over sikkerhets- og etterlevelseskrav med ansvarlig, status, risiko
        og frist. Trenger du en vurdering? Bruk{" "}
        <a href="/risikovurdering">Risikovurdering (AI)</a>.
      </p>

      <form className="card" method="get" style={{ marginBottom: "1rem" }}>
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Søk (tittel, beskrivelse, ansvarlig)</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Søk …" />
          </div>
          <div className="field">
            <label htmlFor="domain">Område</label>
            <select id="domain" name="domain" defaultValue={domain}>
              <option value="">Alle områder</option>
              {DOMAINS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status}>
              <option value="">Alle statuser</option>
              {CONTROL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: "0.6rem" }}>
          <div className="field" style={{ margin: 0, minWidth: "180px" }}>
            <label htmlFor="risk">Risikonivå</label>
            <select id="risk" name="risk" defaultValue={risk}>
              <option value="">Alle nivåer</option>
              {RISK_LEVELS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <button type="submit" className="btn">
              Bruk filter
            </button>
            {hasFilters && (
              <a href="/sikkerhet" className="btn secondary">
                Nullstill
              </a>
            )}
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: 0 }}>
        {items.length === 0 ? (
          <div className="empty">
            Ingen punkter funnet{hasFilters ? " med valgte filtre." : "."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="list">
              <thead>
                <tr>
                  <th>Tittel</th>
                  <th>Område</th>
                  <th>Status</th>
                  <th>Risiko</th>
                  <th>Frist</th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="title-cell">
                      <a href={`/sikkerhet/${c.id}`}>
                        <strong>{c.title}</strong>
                      </a>
                      <div className="muted small">{categoryLabel(c.category)}</div>
                    </td>
                    <td data-label="Område" className="small">
                      {domainIcon(c.domain)} {domainLabel(c.domain)}
                    </td>
                    <td data-label="Status">
                      <ControlStatusBadge status={c.status} />
                    </td>
                    <td data-label="Risiko">
                      <RiskBadge level={c.riskLevel} />
                    </td>
                    <td data-label="Frist" className="small">
                      {c.reviewDate ? (
                        <ReminderPill date={c.reviewDate} />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted small" style={{ marginTop: "0.75rem" }}>
        Viser {items.length} punkt{items.length === 1 ? "" : "er"}.
      </p>
    </>
  );
}
