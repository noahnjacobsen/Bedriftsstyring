import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateControl } from "@/lib/security-actions";
import { ControlForm } from "@/components/ControlForm";

export default async function EditControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const controlId = Number(id);
  const item = await prisma.controlItem.findUnique({ where: { id: controlId } });
  if (!item) notFound();

  const action = updateControl.bind(null, controlId);

  return (
    <>
      <div className="page-head">
        <h1>Rediger kontrollpunkt</h1>
        <a href={`/sikkerhet/${controlId}`} className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <ControlForm
        action={action}
        initial={item}
        submitLabel="Lagre endringer"
        cancelHref={`/sikkerhet/${controlId}`}
      />
    </>
  );
}
