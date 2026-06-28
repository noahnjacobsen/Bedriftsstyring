import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { typeLabel } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contract = await prisma.contract.findUnique({ where: { id: Number(id) } });
  if (!contract) notFound();

  return (
    <div className="print-page">
      <div
        className="no-print"
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}
      >
        <a href={`/kontrakter/${contract.id}`} className="btn secondary">
          ← Tilbake
        </a>
        <PrintButton />
      </div>

      <div className="document">
        <div className="doc-header">
          <strong>Hjem &amp; Hage Tjenester AS</strong>
          <span>Kontrakt</span>
        </div>

        {contract.documentBody ? (
          <pre className="doc-body">{contract.documentBody}</pre>
        ) : (
          <>
            <h1 style={{ marginTop: "1rem" }}>{contract.title}</h1>
            <p className="muted">{typeLabel(contract.type)}</p>

            <table className="doc-table">
              <tbody>
                <tr>
                  <th>Motpart</th>
                  <td>{contract.counterpartyName}</td>
                </tr>
                <tr>
                  <th>Adresse</th>
                  <td>{contract.counterpartyAddress ?? "—"}</td>
                </tr>
                <tr>
                  <th>Telefon</th>
                  <td>{contract.counterpartyPhone ?? "—"}</td>
                </tr>
                <tr>
                  <th>E-post</th>
                  <td>{contract.counterpartyEmail ?? "—"}</td>
                </tr>
                <tr>
                  <th>Pris</th>
                  <td>{formatMoney(contract.amount, contract.amountUnit)}</td>
                </tr>
                <tr>
                  <th>Startdato</th>
                  <td>{formatDate(contract.startDate)}</td>
                </tr>
                <tr>
                  <th>Slutt-/fornyelsesdato</th>
                  <td>{formatDate(contract.endDate)}</td>
                </tr>
              </tbody>
            </table>

            {contract.notes && (
              <>
                <h3>Notater</h3>
                <p style={{ whiteSpace: "pre-wrap" }}>{contract.notes}</p>
              </>
            )}

            <div className="signatures">
              <div>
                <div className="sig-line" />
                Leverandør
              </div>
              <div>
                <div className="sig-line" />
                {contract.counterpartyName}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
