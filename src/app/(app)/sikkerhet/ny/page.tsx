import { createControl } from "@/lib/security-actions";
import { ControlForm } from "@/components/ControlForm";

export default function NewControlPage() {
  return (
    <>
      <div className="page-head">
        <h1>Nytt kontrollpunkt</h1>
        <a href="/sikkerhet" className="btn secondary">
          ← Tilbake
        </a>
      </div>
      <ControlForm
        action={createControl}
        submitLabel="Opprett punkt"
        cancelHref="/sikkerhet"
      />
    </>
  );
}
