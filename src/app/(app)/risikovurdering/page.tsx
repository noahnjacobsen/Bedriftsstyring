import { prisma } from "@/lib/db";
import { domainIcon, domainLabel } from "@/lib/security";
import { formatDate } from "@/lib/format";
import { RiskAssessor } from "@/components/RiskAssessor";

export const dynamic = "force-dynamic";

export default async function RiskAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ tittel?: string; domene?: string }>;
}) {
  const { tittel, domene } = await searchParams;

  const recent = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <>
      <div className="page-head">
        <h1>Risikovurdering (AI)</h1>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        «Den ærlige kritikeren» ser på en situasjon, beslutning eller et tiltak og
        flagger risiko innen <strong>IT-sikkerhet/personvern</strong> og{" "}
        <strong>drift/HMS/juss</strong>. Still gjerne oppfølgingsspørsmål.
      </p>

      <RiskAssessor initialTitle={tittel ?? ""} initialDomain={domene || "begge"} />

      <div className="section-title">
        <h2 style={{ margin: 0 }}>Lagrede vurderinger</h2>
      </div>
      {recent.length === 0 ? (
        <div className="card empty">Ingen lagrede vurderinger ennå.</div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <ul className="timeline" style={{ padding: "0.25rem 1rem" }}>
            {recent.map((a) => (
              <li
                key={a.id}
                style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "center" }}
              >
                <span>
                  {domainIcon(a.domain)}{" "}
                  <a href={`/risikovurdering/${a.id}`}>
                    <strong>{a.title}</strong>
                  </a>{" "}
                  <span className="muted small">· {domainLabel(a.domain)}</span>
                </span>
                <span className="muted small" style={{ whiteSpace: "nowrap" }}>
                  {formatDate(a.createdAt)}
                  {a.actor ? ` · ${a.actor}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
