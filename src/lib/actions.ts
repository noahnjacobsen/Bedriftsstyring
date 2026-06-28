"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { statusLabel } from "./constants";
import { getCurrentUser } from "./auth";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// ---- helpers ---------------------------------------------------------------

function str(form: FormData, key: string): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function date(form: FormData, key: string): Date | null {
  const v = str(form, key);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function num(form: FormData, key: string): number | null {
  const v = str(form, key);
  if (!v) return null;
  const n = parseFloat(v.replace(/\s/g, "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function bool(form: FormData, key: string): boolean {
  const v = form.get(key);
  return v === "on" || v === "true" || v === "1";
}

async function logChange(contractId: number | null, action: string, summary: string) {
  const user = await getCurrentUser().catch(() => null);
  await prisma.changeLog.create({
    data: { contractId, action, summary, actor: user?.username ?? null },
  });
}

function contractDataFromForm(form: FormData) {
  return {
    title: str(form, "title") ?? "Uten tittel",
    type: str(form, "type") ?? "kundeavtale",
    status: str(form, "status") ?? "utkast",
    counterpartyName: str(form, "counterpartyName") ?? "",
    counterpartyPhone: str(form, "counterpartyPhone"),
    counterpartyEmail: str(form, "counterpartyEmail"),
    counterpartyAddress: str(form, "counterpartyAddress"),
    startDate: date(form, "startDate"),
    endDate: date(form, "endDate"),
    signedDate: date(form, "signedDate"),
    amount: num(form, "amount"),
    amountUnit: str(form, "amountUnit"),
    autoRenew: bool(form, "autoRenew"),
    notes: str(form, "notes"),
    customerId: (() => {
      const v = num(form, "customerId");
      return v == null ? null : Math.round(v);
    })(),
  };
}

// ---- contract CRUD ---------------------------------------------------------

export async function createContract(form: FormData) {
  const data = contractDataFromForm(form);
  const created = await prisma.contract.create({ data });
  await logChange(created.id, "opprettet", `Opprettet «${created.title}».`);
  revalidatePath("/kontrakter");
  revalidatePath("/");
  redirect(`/kontrakter/${created.id}`);
}

export async function updateContract(id: number, form: FormData) {
  const data = contractDataFromForm(form);
  const before = await prisma.contract.findUnique({ where: { id } });
  await prisma.contract.update({ where: { id }, data });

  let summary = "Oppdaterte kontraktdetaljer.";
  if (before && before.status !== data.status) {
    summary = `Status endret fra «${statusLabel(before.status)}» til «${statusLabel(data.status)}».`;
  }
  await logChange(id, "endret", summary);

  revalidatePath("/kontrakter");
  revalidatePath(`/kontrakter/${id}`);
  revalidatePath("/");
  redirect(`/kontrakter/${id}`);
}

export async function deleteContract(id: number) {
  const c = await prisma.contract.findUnique({ where: { id } });
  // Remove any uploaded file from disk.
  if (c?.filePath) {
    await fs.unlink(path.join(UPLOAD_DIR, c.filePath)).catch(() => {});
  }
  await prisma.contract.delete({ where: { id } });
  revalidatePath("/kontrakter");
  revalidatePath("/");
  redirect("/kontrakter");
}

// ---- file upload -----------------------------------------------------------

// Max upload size — Vercel serverless caps request bodies at ~4.5 MB.
const MAX_UPLOAD = 4 * 1024 * 1024;

export async function uploadSignedFile(id: number, form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/kontrakter/${id}`);
  }
  const f = file as File;
  if (f.size > MAX_UPLOAD) {
    redirect(`/kontrakter/${id}?fileerror=stor`);
  }

  const buffer = Buffer.from(await f.arrayBuffer());
  // Validate it's really a PDF (declared type or "%PDF" magic bytes).
  const isPdf =
    f.type === "application/pdf" ||
    buffer.subarray(0, 4).toString("latin1") === "%PDF";
  if (!isPdf) {
    redirect(`/kontrakter/${id}?fileerror=type`);
  }

  // Clean up any legacy on-disk file from the local version.
  const prev = await prisma.contract.findUnique({ where: { id } });
  if (prev?.filePath) {
    await fs.unlink(path.join(UPLOAD_DIR, prev.filePath)).catch(() => {});
  }

  // Store the PDF in the DB so it works on serverless hosting.
  await prisma.contract.update({
    where: { id },
    data: { fileName: f.name, fileData: buffer, filePath: null },
  });
  await logChange(id, "fil", `Lastet opp fil «${f.name}».`);

  revalidatePath(`/kontrakter/${id}`);
  redirect(`/kontrakter/${id}`);
}

export async function removeFile(id: number) {
  const c = await prisma.contract.findUnique({ where: { id } });
  if (c?.filePath) {
    await fs.unlink(path.join(UPLOAD_DIR, c.filePath)).catch(() => {});
  }
  await prisma.contract.update({
    where: { id },
    data: { fileName: null, filePath: null, fileData: null },
  });
  await logChange(id, "fil", "Fjernet vedlagt fil.");
  revalidatePath(`/kontrakter/${id}`);
  redirect(`/kontrakter/${id}`);
}

// ---- generate a contract from a template -----------------------------------

export async function createFromTemplate(templateId: string, form: FormData) {
  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template) redirect("/maler");
  const tpl = template!;

  const fields = JSON.parse(tpl.fields) as { key: string; label: string }[];
  const values: Record<string, string> = {};
  for (const field of fields) {
    values[field.key] = (str(form, `f_${field.key}`) ?? "").toString();
  }

  // Fill {{key}} placeholders in the body.
  const body = tpl.body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key: string) =>
    values[key] && values[key].length > 0 ? values[key] : `______`,
  );

  const amount = values["pris"]
    ? parseFloat(values["pris"].replace(/\s/g, "").replace(",", "."))
    : tpl.defaultAmount;

  const created = await prisma.contract.create({
    data: {
      title: tpl.name,
      type: tpl.type,
      status: "utkast",
      counterpartyName: values["kundenavn"] ?? "",
      counterpartyPhone: values["telefon"] ?? null,
      counterpartyEmail: values["epost"] ?? null,
      counterpartyAddress: values["adresse"] ?? null,
      startDate: values["oppstart"] ? new Date(values["oppstart"]) : null,
      amount: amount ?? null,
      amountUnit: tpl.amountUnit,
      autoRenew: tpl.autoRenew,
      documentBody: body,
    },
  });

  await logChange(created.id, "opprettet", `Opprettet fra mal «${tpl.name}».`);
  revalidatePath("/kontrakter");
  revalidatePath("/");
  redirect(`/kontrakter/${created.id}`);
}
