import { createCustomer } from "@/lib/crm-actions";
import { CustomerForm } from "@/components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <>
      <div className="page-head">
        <h1>Ny kunde</h1>
        <a href="/kunder" className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <CustomerForm
        action={createCustomer}
        submitLabel="Opprett kunde"
        cancelHref="/kunder"
      />
    </>
  );
}
