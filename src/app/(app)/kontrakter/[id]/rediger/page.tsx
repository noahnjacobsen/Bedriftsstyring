import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateContract } from "@/lib/actions";
import { ContractForm } from "@/components/ContractForm";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contractId = Number(id);
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) notFound();

  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const action = updateContract.bind(null, contractId);

  return (
    <>
      <div className="page-head">
        <h1>Rediger kontrakt</h1>
        <a href={`/kontrakter/${contractId}`} className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <ContractForm
        action={action}
        initial={contract}
        submitLabel="Lagre endringer"
        cancelHref={`/kontrakter/${contractId}`}
        customers={customers}
      />
    </>
  );
}
