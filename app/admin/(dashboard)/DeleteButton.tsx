"use client";

import { useTransition } from "react";

export function DeleteButton({
  id,
  serverAction,
  label = "Delete",
  confirmText = "Kya aap waqai ye delete karna chahte hain?",
}: {
  id: string;
  serverAction: (formData: FormData) => Promise<void>;
  label?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => startTransition(() => serverAction(formData))}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) {
          e.preventDefault();
        }
      }}
      style={{ display: "inline" }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="admin-action-btn danger"
        disabled={pending}
        title={label}
      >
        {pending ? "..." : "🗑"}
      </button>
    </form>
  );
}
