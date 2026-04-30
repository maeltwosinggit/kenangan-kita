"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { isAdmin: boolean };

export default function HomeButtons({ isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"dashboard" | "create" | null>(null);

  const navigate = (to: "dashboard" | "create") => {
    setLoading(to);
    router.push(to === "dashboard" ? "/admin/events" : "/admin/events/new");
  };

  return (
    <div className="mt-8 w-full space-y-3">
      {isAdmin && (
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => navigate("dashboard")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-70"
        >
          {loading === "dashboard" ? (
            <>
              <Spinner />
              Loading...
            </>
          ) : (
            "Admin Dashboard"
          )}
        </button>
      )}
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => navigate("create")}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium disabled:opacity-70"
      >
        {loading === "create" ? (
          <>
            <Spinner />
            Loading...
          </>
        ) : (
          "Create Event"
        )}
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}
