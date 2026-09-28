import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonData, jsonError } from "@/lib/api-response";
import { Priority } from "@/app/generated/prisma/client";

const MAX_TITLE_LENGTH = 200;
const PRIORITY_VALUES: Priority[] = [Priority.HIGH, Priority.MEDIUM, Priority.LOW];

function isPriority(value: unknown): value is Priority {
  return PRIORITY_VALUES.includes(value as Priority);
}

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "asc" },
  });

  return jsonData(tasks);
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);

  const title =
    body !== null && typeof body === "object" && "title" in body
      ? (body as { title: unknown }).title
      : undefined;

  if (typeof title !== "string" || title.trim().length === 0 || title.trim().length > MAX_TITLE_LENGTH) {
    return jsonError("Title is required", 400);
  }

  const rawPriority =
    body !== null && typeof body === "object" && "priority" in body
      ? (body as { priority: unknown }).priority
      : undefined;

  if (rawPriority !== undefined && !isPriority(rawPriority)) {
    return jsonError("Priority must be one of HIGH, MEDIUM, LOW", 400);
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      priority: rawPriority ?? Priority.MEDIUM,
    },
  });

  return jsonData(task, 201);
}
