import { useGetCrossnumbersHistory, getGetCrossnumbersHistoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame, Trophy, CheckCircle2, XCircle, Grid3X3, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

function formatTime(ms?: number | null) {
  if (!ms) return "--:--";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function HistoryPage() {
  const { data: history, isLoading } = useGetCrossnumbersHistory({
    query: {
      queryKey: getGetCrossnumbersHistoryQueryKey(),
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Journey</h1>
        <p className="text-muted-foreground">Every puzzle solved builds the mind.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Flame className="w-8 h-8 text-orange-500 mb-3 opacity-80" />
            <div className="text-3xl font-bold font-mono tracking-tighter">{history?.currentStreak || 0}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Current Streak</div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mb-3 opacity-80" />
            <div className="text-3xl font-bold font-mono tracking-tighter">{history?.longestStreak || 0}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Longest Streak</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Grid3X3 className="w-8 h-8 text-primary mb-3 opacity-80" />
            <div className="text-3xl font-bold font-mono tracking-tighter">{history?.totalSolved || 0}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Total Solved</div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Clock className="w-8 h-8 text-blue-500 mb-3 opacity-80" />
            <div className="text-3xl font-bold font-mono tracking-tighter">{formatTime(history?.bestSolveTimeMs)}</div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Best Time</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border">
          <CardTitle>Recent Puzzles</CardTitle>
          <CardDescription>Your performance over time.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!history?.entries?.length ? (
            <div className="p-12 text-center flex flex-col items-center">
              <Grid3X3 className="w-12 h-12 text-muted mb-4" />
              <h3 className="text-lg font-medium text-foreground">No history yet</h3>
              <p className="text-muted-foreground">Solve today's puzzle to start your record.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {history.entries.map((entry) => (
                <div key={entry.date} className="p-4 sm:px-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border shrink-0 shadow-sm">
                      {entry.solved ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-foreground">
                        {format(parseISO(entry.date), "MMM d, yyyy")}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {entry.dayName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.solved ? (
                      <>
                        <div className="font-mono font-bold text-lg">{formatTime(entry.solveTimeMs)}</div>
                        {entry.errorCount > 0 && (
                          <div className="text-xs text-destructive font-medium">
                            {entry.errorCount} {entry.errorCount === 1 ? 'error' : 'errors'}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-sm font-medium text-muted-foreground px-2 py-1 bg-muted rounded">Failed</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
