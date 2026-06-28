import { prisma } from "@/lib/db";
import { CUSTOMER_TYPES, CUSTOMER_STATUSES, customerTypeLabel } from "@/lib/crm";
import { CustomerStatusBadge } from "@/components/CustomerStatusBadge";
import type { Prisma } from "@prisma/client";

type Search = { q?: string; type?: string; status?: string };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const type = sp.type ?? "";
  const status = sp.status ?? "";

  const and: Prisma.CustomerWhereInput[] = [];
  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (type) and.push({ type });
  if (status) and.push({ status });

  const customers = await prisma.customer.findMany({
    where: and.length ? { AND: and } : undefined,
    orderBy: [{ name: "asc" }],
    include: { _count: { select: { contracts: true, activities: true } } },
  });

  const hasFilters = Boolean(q || type || status);

  return (
    <>
      <div className="page-head">
        <h1>Kunder</h1>
        <a href="/kunder/ny" className="btn">
          + Ny kunde
        </a>
      </div>

      <form className="card" method="get" style={{ marginBottom: "1rem" }}>
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Søk (navn, e-post, telefon, adresse)</label>
            <input id="q" name="q" type="search" defaultValue={q} placeholder="Søk …" />
          </div>
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={type}>
              <option value="">Alle typer</option>
              {CUSTOMER_TYPES.map((t) => (
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
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: "0.6rem" }}>
          <button type="submit" className="btn">
            Bruk filter
          </button>
          {hasFilters && (
            <a href="/kunder" className="btn secondary">
              Nullstill
            </a>
          )}
        </div>
      </form>

      <div className="card" style={{ padding: 0 }}>
        {customers.length === 0 ? (
          <div className="empty">
            Ingen kunder funnet{hasFilters ? " med valgte filtre." : "."}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="list">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Telefon</th>
                  <th className="right">Kontrakter</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td className="title-cell">
                      <a href={`/kunder/${c.id}`}>
                        <strong>{c.name}</strong>
                      </a>
                    </td>
                    <td data-label="Type" className="muted small">
                      {customerTypeLabel(c.type)}
                    </td>
                    <td data-label="Status">
                      <CustomerStatusBadge status={c.status} />
                    </td>
                    <td data-label="Telefon" className="small">
                      {c.phone ?? "—"}
                    </td>
                    <td data-label="Kontrakter" className="right">
                      {c._count.contracts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="muted small" style={{ marginTop: "0.75rem" }}>
        Viser {customers.length} kunde{customers.length === 1 ? "" : "r"}.
      </p>
    </>
  );
}
