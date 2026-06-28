import { prisma } from "@/lib/db";
import { CONTRACT_TYPES, STATUSES, typeLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ReminderPill } from "@/components/ReminderPill";
import type { Prisma } from "@prisma/client";

type Search = {
  q?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
};

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = sp.type ?? "";
  const status = sp.status ?? "";
  const from = sp.from ?? "";
  const to = sp.to ?? "";

  const and: Prisma.ContractWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { counterpartyName: { contains: q, mode: "insensitive" } },
        { counterpartyEmail: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (type) and.push({ type });
  if (status) and.push({ status });
  if (from || to) {
    const range: Prisma.DateTimeNullableFilter = {};
    if (from) range.gte = new Date(from);
    if (to) range.lte = new Date(`${to}T23:59:59`);
    and.push({ OR: [{ startDate: range }, { endDate: range }] });
  }

  const contracts = await prisma.contract.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ updatedAt: "desc" }],
  });

  const hasFilters = Boolean(q || type || status || from || to);

  return (
    <>
      <div className="page-head">
        <h1>Kontrakter</h1>
        <a href="/kontrakter/ny" className="btn">
          + Ny kontrakt
        </a>
      </div>

      <form className="card" method="get" style={{ marginBottom: "1rem" }}>
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Søk (tittel, motpart, e-post)</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Søk …" />
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={type}>
              <option value="">Alle typer</option>
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status}>
              <option value="">Alle statuser</option>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="filters" style={{ marginTop: "0.6rem" }}>
          <div className="filter-dates">
            <div className="field">
              <label htmlFor="from">Dato fra</label>
              <input id="from" name="from" type="date" defaultValue={from} />
            </div>
            <div className="field">
              <label htmlFor="to">Dato til</label>
              <input id="to" name="to" type="date" defaultValue={to} />
            </div>
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end", gap: "0.5rem" }}>
            <button type="submit" className="btn">
              Bruk filter
            </button>
          </div>
          <div className="field" style={{ display: "flex", alignItems: "flex-end" }}>
            {hasFilters && (
              <a href="/kontrakter" className="btn secondary">
                Nullstill
              </a>
            )}
          </div>
        </div>
      </form>

      <div className="card" style={{ padding: 0 }}>
        {contracts.length === 0 ? (
          <div className="empty">
            Ingen kontrakter funnet{hasFilters ? " med valgte filtre." : "."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="list">
              <thead>
                <tr>
                  <th>Tittel</th>
                  <th>Type</th>
                  <th>Motpart</th>
                  <th>Status</th>
                  <th className="right">Beløp</th>
                  <th>Slutt-/fornyelse</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="title-cell">
                      <a href={`/kontrakter/${c.id}`}>
                        <strong>{c.title}</strong>
                      </a>
                    </td>
                    <td className="muted small" data-label="Type">
                      {typeLabel(c.type)}
                    </td>
                    <td data-label="Motpart">{c.counterpartyName}</td>
                    <td data-label="Status">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="right" data-label="Beløp">
                      {formatMoney(c.amount, c.amountUnit)}
                    </td>
                    <td className="small" data-label="Slutt-/fornyelse">
                      {c.endDate ? <ReminderPill date={c.endDate} /> : <span className="muted">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted small" style={{ marginTop: "0.75rem" }}>
        Viser {contracts.length} kontrakt{contracts.length === 1 ? "" : "er"}.
      </p>
    </>
  );
}
