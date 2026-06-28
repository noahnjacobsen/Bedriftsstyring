import { promises as fs } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Serves a contract's signed PDF. Stored in the DB (fileData); legacy local
// files (filePath) are supported as a fallback. Requires a logged-in user.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return new Response("Ikke innlogget", { status: 401 });

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id: Number(id) },
    select: { fileName: true, fileData: true, filePath: true },
  });
  if (!contract) return new Response("Fil ikke funnet", { status: 404 });

  const safeName = (contract.fileName ?? "vedlegg.pdf").replace(/[^a-zA-Z0-9._ -]/g, "_");
  const headers = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${safeName}"`,
    "Cache-Control": "private, no-store",
  };

  // Preferred: bytes from the database.
  if (contract.fileData) {
    return new Response(new Uint8Array(contract.fileData), { headers });
  }

  // Fallback: legacy local file (only exists on the local/dev install).
  if (contract.filePath) {
    try {
      const data = await fs.readFile(
        path.join(UPLOAD_DIR, path.basename(contract.filePath)),
      );
      return new Response(new Uint8Array(data), { headers });
    } catch {
      return new Response("Fil ikke funnet", { status: 404 });
    }
  }

  return new Response("Fil ikke funnet", { status: 404 });
}
