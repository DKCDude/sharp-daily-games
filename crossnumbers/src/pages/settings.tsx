import { useEffect, useState } from "react";
import { useGetCrossnumbersReminder, useUpdateCrossnumbersReminder, getGetCrossnumbersReminderQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Bell, BellRing } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: reminder, isLoading } = useGetCrossnumbersReminder({
    query: {
      queryKey: getGetCrossnumbersReminderQueryKey(),
    }
  });

  const updateReminder = useUpdateCrossnumbersReminder();
  
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState("09");
  const [minute, setMinute] = useState("00");

  useEffect(() => {
    if (reminder) {
      setEnabled(reminder.enabled);
      setHour(reminder.hourLocal.toString().padStart(2, "0"));
      setMinute(reminder.minuteLocal.toString().padStart(2, "0"));
    }
  }, [reminder]);

  const handleSave = () => {
    updateReminder.mutate(
      {
        data: {
          enabled,
          hourLocal: parseInt(hour, 10),
          minuteLocal: parseInt(minute, 10),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          channel: "browser"
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCrossnumbersReminderQueryKey() });
          toast({
            title: "Settings saved",
            description: "Your reminder preferences have been updated.",
          });
          
          if (enabled && Notification.permission !== "granted") {
            Notification.requestPermission();
          }
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to save settings. Please try again.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleTestNotification = async () => {
    let perm = Notification.permission;
    if (perm !== "granted") {
      perm = await Notification.requestPermission();
    }
    
    if (perm === "granted") {
      new Notification("Crossnumbers", {
        body: "Your daily puzzle is waiting!",
        icon: "/favicon.svg"
      });
      toast({
        title: "Notification sent",
        description: "You should see a browser notification now.",
      });
    } else {
      toast({
        title: "Permission denied",
        description: "Please allow notifications in your browser settings.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) return <div className="animate-pulse flex space-y-4 flex-col"><div className="h-8 w-48 bg-muted rounded"></div><div className="h-64 bg-muted rounded-xl"></div></div>;

  return (
    <div className="space-y-8 max-w-2xl animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your puzzle experience.</p>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Daily Reminders
          </CardTitle>
          <CardDescription>
            Get a nudge when the new puzzle drops. Note: Browser notifications only appear when a Crossnumbers tab is open.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive daily browser notifications</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
              <Label>Reminder Time (Local)</Label>
              <div className="flex items-center gap-2">
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-[100px]"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                >
                  {Array.from({length: 24}).map((_, i) => (
                    <option key={i} value={i.toString().padStart(2, "0")}>
                      {i.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="font-bold text-lg">:</span>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-w-[100px]"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-border">
            <Button variant="outline" onClick={handleTestNotification} type="button">
              <BellRing className="w-4 h-4 mr-2" />
              Test Notification
            </Button>
            <Button onClick={handleSave} disabled={updateReminder.isPending}>
              {updateReminder.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
