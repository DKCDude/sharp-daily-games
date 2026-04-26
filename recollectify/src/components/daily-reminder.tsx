import { useEffect, useState } from "react";
import { Bell, BellOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "recollectify.reminder.v1";
const TIMER_KEY = "recollectify.reminder.lastFiredDate";

type Prefs = {
  enabled: boolean;
  hour: number;
  minute: number;
};

const DEFAULT_PREFS: Prefs = { enabled: false, hour: 9, minute: 0 };

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      hour: clampInt(parsed.hour, 0, 23, 9),
      minute: clampInt(parsed.minute, 0, 59, 0),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

function savePrefs(p: Prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

function fireNotification() {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("Recollectify", {
      body: "A new word is waiting. Keep your streak alive.",
      icon: "/favicon.svg",
    });
  } catch {
    // ignore — some browsers throw if invoked off a user gesture without SW
  }
}

export function useScheduleReminder() {
  useEffect(() => {
    let timer: number | undefined;

    function schedule() {
      const prefs = loadPrefs();
      if (!prefs.enabled) return;
      if (typeof Notification === "undefined") return;
      if (Notification.permission !== "granted") return;

      const delay = msUntilNext(prefs.hour, prefs.minute);
      timer = window.setTimeout(() => {
        const lastFired = localStorage.getItem(TIMER_KEY);
        const today = todayKey();
        if (lastFired !== today) {
          fireNotification();
          localStorage.setItem(TIMER_KEY, today);
        }
        schedule();
      }, delay);
    }

    schedule();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, []);
}

export function DailyReminderCard() {
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs());
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  if (permission === "unsupported") {
    return null;
  }

  const canEnable = permission === "granted";

  async function handleEnable() {
    if (typeof Notification === "undefined") return;
    let perm = Notification.permission;
    if (perm === "default") {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }
    if (perm === "granted") {
      const next = { ...prefs, enabled: true };
      setPrefs(next);
      setSavedAt(Date.now());
    }
  }

  function handleDisable() {
    setPrefs({ ...prefs, enabled: false });
    setSavedAt(Date.now());
  }

  function handleTimeChange(field: "hour" | "minute", value: string) {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n)) return;
    const next = { ...prefs, [field]: n };
    setPrefs(next);
    setSavedAt(Date.now());
  }

  const justSaved = savedAt && Date.now() - savedAt < 2500;

  return (
    <div className="w-full mt-2 rounded-xl border border-border/60 bg-muted/40 p-4 text-left">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {prefs.enabled && canEnable ? (
            <Bell className="w-4 h-4" />
          ) : (
            <BellOff className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Come back tomorrow</h4>
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] text-primary">
                <Check className="w-3 h-3" /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
            Get a gentle nudge so you don't lose your streak. Browser notifications fire while a Recollectify tab is open.
          </p>

          {prefs.enabled && canEnable ? (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Remind me at</span>
              <select
                value={prefs.hour.toString().padStart(2, "0")}
                onChange={(e) => handleTimeChange("hour", e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              >
                {Array.from({ length: 24 }).map((_, i) => (
                  <option key={i} value={i.toString().padStart(2, "0")}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-sm">:</span>
              <select
                value={prefs.minute.toString().padStart(2, "0")}
                onChange={(e) => handleTimeChange("minute", e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-sm tabular-nums"
              >
                {["00", "15", "30", "45"].map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto h-8 text-xs text-muted-foreground"
                onClick={handleDisable}
              >
                Turn off
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Button size="sm" onClick={handleEnable} className="h-8">
                {permission === "denied"
                  ? "Notifications blocked"
                  : "Remind me daily"}
              </Button>
              {permission === "denied" && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Notifications are blocked in your browser settings.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
