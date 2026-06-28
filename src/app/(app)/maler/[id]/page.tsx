import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { typeLabel } from "@/lib/constants";
import { createFromTemplate } from "@/lib/actions";

type Field = {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
};

export default async function UseTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) notFound();

  const fields = JSON.parse(template.fields) as Field[];
  const action = createFromTemplate.bind(null, template.id);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{template.name}</h1>
          <span className="muted small">{typeLabel(template.type)}</span>
        </div>
        <a href="/maler" className="btn secondary">
          ← Tilbake
        </a>
      </div>

      <form action={action} className="card">
        <h2>Fyll inn felter</h2>
        <div className="form-grid">
          {fields.map((f) => (
            <div className="field" key={f.key}>
              <label htmlFor={`f_${f.key}`}>{f.label}</label>
              <input
                id={`f_${f.key}`}
                name={`f_${f.key}`}
                type={f.type === "date" ? "date" : "text"}
                placeholder={f.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn">
            Generer kontrakt
          </button>
          <a href="/maler" className="btn secondary">
            Avbryt
          </a>
        </div>
        <p className="muted small">
          Det opprettes en ny kontrakt med status «Utkast» og et utfylt, utskriftsvennlig
          dokument.
        </p>
      </form>

      <div className="card">
        <h3>Forhåndsvisning av mal</h3>
        <pre className="doc-preview">{template.body}</pre>
      </div>
    </>
  );
}
