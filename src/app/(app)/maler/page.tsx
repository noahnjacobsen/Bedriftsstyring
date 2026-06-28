import { prisma } from "@/lib/db";
import { typeLabel } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

// Always read templates live from the DB.
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <div className="page-head">
        <h1>Maler</h1>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Gjenbrukbare norske kontraktmaler. Velg en mal, fyll inn feltene, og generer en
        ny kontrakt med utskriftsvennlig dokument.
      </p>

      {templates.length === 0 ? (
        <div className="card empty">Ingen maler ennå.</div>
      ) : (
        <div className="grid">
          {templates.map((t) => (
            <div className="card" key={t.id}>
              <h2 style={{ marginBottom: "0.25rem" }}>{t.name}</h2>
              <div className="muted small">{typeLabel(t.type)}</div>
              <div className="small" style={{ margin: "0.5rem 0" }}>
                {t.defaultAmount != null && (
                  <>Standardpris: {formatMoney(t.defaultAmount, t.amountUnit)}</>
                )}
                {t.autoRenew && <div className="muted">Fornyes automatisk</div>}
              </div>
              <a href={`/maler/${t.id}`} className="btn">
                Bruk mal →
              </a>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
