"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { getCurrentUser } from "./auth";

// ---- small form helpers ----------------------------------------------------

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

// ---- customers -------------------------------------------------------------

function customerDataFromForm(form: FormData) {
  return {
    name: str(form, "name") ?? "Uten navn",
    type: str(form, "type") ?? "privat",
    status: str(form, "status") ?? "prospekt",
    phone: str(form, "phone"),
    email: str(form, "email"),
    address: str(form, "address"),
    notes: str(form, "notes"),
  };
}

export async function createCustomer(form: FormData) {
  const created = await prisma.customer.create({ data: customerDataFromForm(form) });
  revalidatePath("/kunder");
  revalidatePath("/");
  redirect(`/kunder/${created.id}`);
}

export async function updateCustomer(id: number, form: FormData) {
  await prisma.customer.update({ where: { id }, data: customerDataFromForm(form) });
  revalidatePath("/kunder");
  revalidatePath(`/kunder/${id}`);
  redirect(`/kunder/${id}`);
}

export async function deleteCustomer(id: number) {
  // Contracts keep their snapshot fields; the link is set to null (onDelete: SetNull).
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/kunder");
  revalidatePath("/");
  redirect("/kunder");
}

// ---- activities (interactions & follow-ups) --------------------------------

export async function logActivity(customerId: number, form: FormData) {
  const user = await getCurrentUser().catch(() => null);
  const type = str(form, "type") ?? "notat";
  const summary = str(form, "summary") ?? "";
  const when = date(form, "date") ?? new Date();
  const followUpAt = date(form, "followUpAt");

  if (summary) {
    await prisma.activity.create({
      data: {
        customerId,
        type,
        summary,
        date: when,
        followUpAt,
        // An activity with a future follow-up starts as an open task.
        done: false,
        actor: user?.username ?? null,
      },
    });
  }

  revalidatePath(`/kunder/${customerId}`);
  revalidatePath("/");
  redirect(`/kunder/${customerId}`);
}

export async function toggleActivityDone(activityId: number, customerId: number) {
  const a = await prisma.activity.findUnique({ where: { id: activityId } });
  if (a) {
    await prisma.activity.update({
      where: { id: activityId },
      data: { done: !a.done },
    });
  }
  revalidatePath(`/kunder/${customerId}`);
  revalidatePath("/");
  redirect(`/kunder/${customerId}`);
}

export async function deleteActivity(activityId: number, customerId: number) {
  await prisma.activity.delete({ where: { id: activityId } }).catch(() => {});
  revalidatePath(`/kunder/${customerId}`);
  revalidatePath("/");
  redirect(`/kunder/${customerId}`);
}
