import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateCustomer } from "@/lib/crm-actions";
import { CustomerForm } from "@/components/CustomerForm";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerId = Number(id);
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) notFound();

  const action = updateCustomer.bind(null, customerId);

  return (
    <>
      <div className="page-head">
        <h1>Rediger kunde</h1>
        <a href={`/kunder/${customerId}`} className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <CustomerForm
        action={action}
        initial={customer}
        submitLabel="Lagre endringer"
        cancelHref={`/kunder/${customerId}`}
      />
    </>
  );
}
