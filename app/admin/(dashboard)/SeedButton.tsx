"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { seedStarterData } from "./actions";

export function SeedButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="seed-box">
      <button
        className="btn btn-outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await seedStarterData();
            setMessage(result.message);
            if (result.ok) router.refresh();
          })
        }
      >
        {pending ? "Importing..." : "🌱 Import Starter Data"}
      </button>
      <p className="seed-hint">
        Static catalog (6 categories, 30 products) database mein import karein —
        sirf khali tables par chalega.
      </p>
      {message && (
        <p
          className={
            message.startsWith("Seed complete")
              ? "admin-alert admin-alert-success"
              : "admin-alert admin-alert-error"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
