import { useState, useEffect } from "react";
import { setTestParams } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const TEST_KEY = "sharpdev";

function todayEt(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

export function DevPanel() {
  const isDev =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("dev") === TEST_KEY;

  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayEt);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isDev) return;
    setTestParams({ testDate: date, testKey: TEST_KEY });
    queryClient.invalidateQueries();
  }, [date, isDev]);

  useEffect(() => {
    return () => {
      setTestParams(null);
    };
  }, []);

  if (!isDev) return null;

  async function handleReset() {
    setResetting(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/crossnumbers/attempt?testDate=${date}&testKey=${TEST_KEY}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setMessage("Reset!");
        queryClient.invalidateQueries();
        setTimeout(() => setMessage(null), 1500);
      } else {
        setMessage("Error");
      }
    } finally {
      setResetting(false);
    }
  }

  function handleToday() {
    setDate(todayEt());
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-zinc-900 text-white text-xs rounded-xl px-3 py-2 shadow-2xl flex items-center gap-2.5 border border-zinc-700">
      <span className="bg-amber-400 text-black font-bold px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">
        DEV
      </span>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-white text-xs"
      />
      <button
        onClick={handleReset}
        disabled={resetting}
        className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 px-2 py-1 rounded font-medium whitespace-nowrap"
      >
        {resetting ? "…" : message ?? "Reset"}
      </button>
      <button
        onClick={handleToday}
        className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded font-medium"
      >
        Today
      </button>
    </div>
  );
}
