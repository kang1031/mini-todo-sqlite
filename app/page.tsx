"use client";

import { FormEvent, useEffect, useState } from "react";

type Priority = "HIGH" | "MEDIUM" | "LOW";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  createdAt: string;
};

type TasksResponse = { data: Task[] };
type TaskResponse = { data: Task };
type ErrorResponse = { error: { message: string } };

const PRIORITY_OPTIONS: Priority[] = ["HIGH", "MEDIUM", "LOW"];

const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "낮음",
};

const PRIORITY_BADGE_CLASSES: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  LOW: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadTasks() {
      const res = await fetch("/api/tasks");
      const body = (await res.json()) as TasksResponse;
      setTasks(body.data);
      setIsLoading(false);
    }

    void loadTasks();
  }, []);

  async function handleToggleTask(id: number) {
    setErrorMessage(null);

    const res = await fetch(`/api/tasks/${id}`, { method: "PATCH" });

    if (!res.ok) {
      const body = (await res.json()) as ErrorResponse;
      setErrorMessage(body.error.message);
      return;
    }

    const body = (await res.json()) as TaskResponse;
    setTasks((prev) => prev.map((task) => (task.id === id ? body.data : task)));
  }

  async function handleDeleteTask(id: number) {
    setErrorMessage(null);

    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const body = (await res.json()) as ErrorResponse;
      setErrorMessage(body.error.message);
      return;
    }

    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority }),
    });

    if (!res.ok) {
      const body = (await res.json()) as ErrorResponse;
      setErrorMessage(body.error.message);
      return;
    }

    const body = (await res.json()) as TaskResponse;
    setTasks((prev) => [...prev, body.data]);
    setTitle("");
    setPriority("MEDIUM");
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 px-6 py-16">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          할 일 관리
        </h1>

        <form onSubmit={handleAddTask} className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="새 할 일 제목"
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="rounded border border-zinc-300 px-3 py-2 text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PRIORITY_LABELS[option]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded bg-foreground px-4 py-2 text-background hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            추가
          </button>
        </form>

        {errorMessage && (
          <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
        )}

        {isLoading ? (
          <p className="text-zinc-600 dark:text-zinc-400">불러오는 중...</p>
        ) : tasks.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            아직 할 일이 없습니다. 위에서 새 할 일을 추가해 보세요.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <label className="flex flex-1 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => void handleToggleTask(task.id)}
                  />
                  <span
                    className={
                      task.completed
                        ? "text-zinc-400 line-through"
                        : "text-black dark:text-zinc-50"
                    }
                  >
                    {task.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_BADGE_CLASSES[task.priority]}`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => void handleDeleteTask(task.id)}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
