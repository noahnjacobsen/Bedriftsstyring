import { createContract } from "@/lib/actions";
import { ContractForm } from "@/components/ContractForm";
import { prisma } from "@/lib/db";

export default async function NewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <div className="page-head">
        <h1>Ny kontrakt</h1>
        <a href="/kontrakter" className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <ContractForm
        action={createContract}
        submitLabel="Opprett kontrakt"
        cancelHref="/kontrakter"
        customers={customers}
        initial={customerId ? { customerId: Number(customerId) } : {}}
      />
    </>
  );
}
