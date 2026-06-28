"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";

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

function controlDataFromForm(form: FormData) {
  return {
    title: str(form, "title") ?? "Uten tittel",
    domain: str(form, "domain") ?? "it_sikkerhet",
    category: str(form, "category") ?? "annet",
    status: str(form, "status") ?? "ikke_startet",
    riskLevel: str(form, "riskLevel") ?? "middels",
    description: str(form, "description"),
    owner: str(form, "owner"),
    reviewDate: date(form, "reviewDate"),
    notes: str(form, "notes"),
  };
}

// ---- control items ---------------------------------------------------------

export async function createControl(form: FormData) {
  const created = await prisma.controlItem.create({ data: controlDataFromForm(form) });
  revalidatePath("/sikkerhet");
  revalidatePath("/");
  redirect(`/sikkerhet/${created.id}`);
}

export async function updateControl(id: number, form: FormData) {
  await prisma.controlItem.update({ where: { id }, data: controlDataFromForm(form) });
  revalidatePath("/sikkerhet");
  revalidatePath(`/sikkerhet/${id}`);
  revalidatePath("/");
  redirect(`/sikkerhet/${id}`);
}

export async function deleteControl(id: number) {
  await prisma.controlItem.delete({ where: { id } });
  revalidatePath("/sikkerhet");
  revalidatePath("/");
  redirect("/sikkerhet");
}

// ---- assessments -----------------------------------------------------------

// Persist an AI assessment produced on the client after streaming finished.
export async function saveAssessment(data: {
  title: string;
  domain: string;
  situation: string;
  result: string;
  model: string;
}): Promise<number> {
  const user = await getCurrentUser().catch(() => null);
  const created = await prisma.assessment.create({
    data: {
      title: (data.title || "Risikovurdering").trim(),
      domain: data.domain,
      situation: data.situation,
      result: data.result,
      model: data.model,
      actor: user?.username ?? null,
    },
  });
  revalidatePath("/risikovurdering");
  return created.id;
}

export async function deleteAssessment(id: number) {
  await prisma.assessment.delete({ where: { id } });
  revalidatePath("/risikovurdering");
  redirect("/risikovurdering");
}
