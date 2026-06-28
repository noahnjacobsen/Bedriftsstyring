import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { domainIcon, domainLabel } from "@/lib/security";
import { formatDate } from "@/lib/format";
import { deleteAssessment } from "@/lib/security-actions";
import { Markdown } from "@/components/Markdown";
import { DeleteButton } from "@/components/DeleteButton";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assessment = await prisma.assessment.findUnique({ where: { id: Number(id) } });
  if (!assessment) notFound();

  const del = deleteAssessment.bind(null, assessment.id);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{assessment.title}</h1>
          <span className="muted small">
            {domainIcon(assessment.domain)} {domainLabel(assessment.domain)} ·{" "}
            {formatDate(assessment.createdAt)}
            {assessment.actor ? ` · ${assessment.actor}` : ""} · {assessment.model}
          </span>
        </div>
        <a href="/risikovurdering" className="btn secondary">
          ← Tilbake
        </a>
      </div>

      <div className="card">
        <div className="label">Situasjon / tiltak</div>
        <div className="ai-user" style={{ marginTop: "0.3rem" }}>
          {assessment.situation}
        </div>
      </div>

      <div className="card">
        <h2>Vurdering</h2>
        <Markdown text={assessment.result} />
        <div className="ai-disclaimer">
          Beslutningsstøtte, ikke juridisk/økonomisk rådgivning. Verifiser viktige
          forhold med rett fagperson.
        </div>
      </div>

      <div className="card">
        <h3>Faresone</h3>
        <DeleteButton
          action={del}
          label="Slett vurdering"
          confirmText="Slette denne lagrede vurderingen?"
        />
      </div>
    </>
  );
}
