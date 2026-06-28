import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { domainLabel, domainIcon, categoryLabel } from "@/lib/security";
import { formatDate } from "@/lib/format";
import { deleteControl } from "@/lib/security-actions";
import { ReminderPill } from "@/components/ReminderPill";
import { ControlStatusBadge, RiskBadge } from "@/components/SecurityBadges";
import { DeleteButton } from "@/components/DeleteButton";

export default async function ControlDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const controlId = Number(id);
  const item = await prisma.controlItem.findUnique({ where: { id: controlId } });
  if (!item) notFound();

  const del = deleteControl.bind(null, controlId);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{item.title}</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <ControlStatusBadge status={item.status} />
            <RiskBadge level={item.riskLevel} />
            <span className="muted small">
              {domainIcon(item.domain)} {domainLabel(item.domain)} · {categoryLabel(item.category)}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href="/sikkerhet" className="btn secondary">
            ← Tilbake
          </a>
          <a href={`/sikkerhet/${controlId}/rediger`} className="btn">
            Rediger
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Detaljer</h2>
        <div className="detail-grid">
          <div>
            <div className="label">Ansvarlig</div>
            <div className="value">{item.owner ?? "—"}</div>
          </div>
          <div>
            <div className="label">Frist / neste gjennomgang</div>
            <div className="value">
              {item.reviewDate ? <ReminderPill date={item.reviewDate} /> : "—"}
            </div>
          </div>
          <div>
            <div className="label">Sist endret</div>
            <div className="value">{formatDate(item.updatedAt)}</div>
          </div>
        </div>

        {item.description && (
          <>
            <div className="label" style={{ marginTop: "1rem" }}>
              Beskrivelse
            </div>
            <div className="value" style={{ whiteSpace: "pre-wrap" }}>
              {item.description}
            </div>
          </>
        )}
        {item.notes && (
          <>
            <div className="label" style={{ marginTop: "1rem" }}>
              Notater
            </div>
            <div className="value" style={{ whiteSpace: "pre-wrap" }}>
              {item.notes}
            </div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Trenger du en vurdering?</h3>
        <p className="muted small" style={{ marginTop: 0 }}>
          Be «den ærlige kritikeren» se på dette punktet og flagge risiko.
        </p>
        <a
          href={`/risikovurdering?tittel=${encodeURIComponent(item.title)}&domene=${item.domain}`}
          className="btn secondary"
        >
          🔎 Vurder dette punktet
        </a>
      </div>

      <div className="card">
        <h3>Faresone</h3>
        <DeleteButton
          action={del}
          label="Slett punkt"
          confirmText="Slette dette kontrollpunktet? Dette kan ikke angres."
        />
      </div>
    </>
  );
}
