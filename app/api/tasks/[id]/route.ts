import { prisma } from "@/lib/prisma";
import { jsonData, jsonError } from "@/lib/api-response";

function parseTaskId(rawId: string): number | null {
  const id = Number(rawId);
  return Number.isInteger(id) ? id : null;
}

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseTaskId(rawId);

  if (id === null) {
    return jsonError("Task not found", 404);
  }

  const existing = await prisma.task.findUnique({ where: { id } });

  if (existing === null) {
    return jsonError("Task not found", 404);
  }

  const updated = await prisma.task.update({
    where: { id },
    data: { completed: !existing.completed },
  });

  return jsonData(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseTaskId(rawId);

  if (id === null) {
    return jsonError("Task not found", 404);
  }

  const existing = await prisma.task.findUnique({ where: { id } });

  if (existing === null) {
    return jsonError("Task not found", 404);
  }

  await prisma.task.delete({ where: { id } });

  return jsonData({ id });
}
