import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { typeLabel } from "@/lib/constants";
import { formatDate, formatMoney, relativeDays } from "@/lib/format";
import { deleteContract, uploadSignedFile, removeFile } from "@/lib/actions";
import { StatusBadge } from "@/components/StatusBadge";
import { ReminderPill } from "@/components/ReminderPill";
import { DeleteButton } from "@/components/DeleteButton";

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fileerror?: string }>;
}) {
  const { id } = await params;
  const { fileerror: fileError } = await searchParams;
  const contractId = Number(id);
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
    include: { customer: true },
  });
  if (!contract) notFound();

  const changes = await prisma.changeLog.findMany({
    where: { contractId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const del = deleteContract.bind(null, contractId);
  const upload = uploadSignedFile.bind(null, contractId);
  const remove = removeFile.bind(null, contractId);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{contract.title}</h1>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <StatusBadge status={contract.status} />
            <span className="muted small">{typeLabel(contract.type)}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <a href="/kontrakter" className="btn secondary">
            ← Tilbake
          </a>
          <a href={`/kontrakter/${contractId}/skriv-ut`} className="btn secondary">
            🖨️ Skriv ut
          </a>
          <a href={`/kontrakter/${contractId}/rediger`} className="btn">
            Rediger
          </a>
        </div>
      </div>

      <div className="card">
        <h2>Detaljer</h2>
        <div className="detail-grid">
          <div>
            <div className="label">Motpart</div>
            <div className="value">{contract.counterpartyName}</div>
          </div>
          <div>
            <div className="label">Kunde (CRM)</div>
            <div className="value">
              {contract.customer ? (
                <a href={`/kunder/${contract.customer.id}`}>{contract.customer.name}</a>
              ) : (
                <span className="muted">Ikke knyttet</span>
              )}
            </div>
          </div>
          <div>
            <div className="label">Telefon</div>
            <div className="value">{contract.counterpartyPhone ?? "—"}</div>
          </div>
          <div>
            <div className="label">E-post</div>
            <div className="value">
              {contract.counterpartyEmail ? (
                <a href={`mailto:${contract.counterpartyEmail}`}>
                  {contract.counterpartyEmail}
                </a>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div>
            <div className="label">Adresse</div>
            <div className="value">{contract.counterpartyAddress ?? "—"}</div>
          </div>
          <div>
            <div className="label">Beløp / pris</div>
            <div className="value">{formatMoney(contract.amount, contract.amountUnit)}</div>
          </div>
          <div>
            <div className="label">Startdato</div>
            <div className="value">{formatDate(contract.startDate)}</div>
          </div>
          <div>
            <div className="label">Slutt-/fornyelsesdato</div>
            <div className="value">
              {contract.endDate ? <ReminderPill date={contract.endDate} /> : "—"}
            </div>
          </div>
          <div>
            <div className="label">Signeringsdato</div>
            <div className="value">{formatDate(contract.signedDate)}</div>
          </div>
          <div>
            <div className="label">Fornyes automatisk</div>
            <div className="value">{contract.autoRenew ? "Ja" : "Nei"}</div>
          </div>
          <div>
            <div className="label">Sist endret</div>
            <div className="value">{formatDate(contract.updatedAt)}</div>
          </div>
        </div>

        {contract.notes && (
          <>
            <div className="label" style={{ marginTop: "1rem" }}>
              Notater
            </div>
            <div className="value" style={{ whiteSpace: "pre-wrap" }}>
              {contract.notes}
            </div>
          </>
        )}
      </div>

      {/* Generated contract document */}
      {contract.documentBody && (
        <div className="card">
          <div className="section-title" style={{ margin: 0 }}>
            <h2 style={{ margin: 0 }}>Kontraktdokument</h2>
            <a href={`/kontrakter/${contractId}/skriv-ut`} className="btn secondary small">
              Åpne utskriftsvennlig
            </a>
          </div>
          <pre className="doc-preview">{contract.documentBody}</pre>
        </div>
      )}

      {/* Signed PDF */}
      <div className="card">
        <h2>Signert fil (PDF)</h2>
        {fileError === "stor" && (
          <div className="login-error">Filen er for stor (maks 4 MB).</div>
        )}
        {fileError === "type" && (
          <div className="login-error">Bare PDF-filer kan lastes opp.</div>
        )}
        {contract.fileName ? (
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <a href={`/api/uploads/${contractId}`} target="_blank" rel="noreferrer">
              📎 {contract.fileName}
            </a>
            <form action={remove}>
              <button type="submit" className="btn secondary small">
                Fjern fil
              </button>
            </form>
          </div>
        ) : (
          <p className="muted small" style={{ marginTop: 0 }}>
            Ingen fil lastet opp ennå.
          </p>
        )}

        <form action={upload} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <input type="file" name="file" accept="application/pdf" />
          <button type="submit" className="btn">
            Last opp PDF
          </button>
        </form>
        <p className="muted small" style={{ marginBottom: 0 }}>
          PDF, maks 4 MB.
        </p>
      </div>

      {/* Change log */}
      <div className="card">
        <h2>Endringslogg</h2>
        {changes.length === 0 ? (
          <p className="muted small" style={{ margin: 0 }}>
            Ingen hendelser registrert.
          </p>
        ) : (
          <ul className="timeline">
            {changes.map((ch) => (
              <li key={ch.id}>
                <span>{ch.summary}</span>{" "}
                <span className="muted small">
                  — {formatDate(ch.createdAt)} ({relativeDays(ch.createdAt)})
                  {ch.actor ? ` · ${ch.actor}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h3>Faresone</h3>
        <DeleteButton action={del} label="Slett kontrakt" />
      </div>
    </>
  );
}
