import { useGetCrossnumbersLeaderboard, useGetCrossnumbersStats, getGetCrossnumbersLeaderboardQueryKey, getGetCrossnumbersStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Flame, Timer, Medal, Users, Activity, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function LeaderboardPage() {
  const { data: leaderboard, isLoading: lbLoading } = useGetCrossnumbersLeaderboard({
    query: {
      queryKey: getGetCrossnumbersLeaderboardQueryKey(),
    }
  });

  const { data: stats, isLoading: statsLoading } = useGetCrossnumbersStats({
    query: {
      queryKey: getGetCrossnumbersStatsQueryKey(),
    }
  });

  if (lbLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">The sharpest minds in the game.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Users className="w-6 h-6 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold font-mono">{stats?.playersToday || 0}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Players Today</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Target className="w-6 h-6 text-primary mb-2" />
            <div className="text-2xl font-bold font-mono">{stats?.solvesToday || 0}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Solves Today</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Activity className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold font-mono">{stats?.averageSolveSecondsToday ? formatTime(stats.averageSolveSecondsToday * 1000) : "--:--"}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Avg Time</div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold font-mono">{stats?.longestStreakEver || 0}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">All-Time Best Streak</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longest Streaks */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Longest Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!leaderboard?.topLongest.length ? (
              <div className="text-center py-8 text-muted-foreground">No data yet</div>
            ) : (
              <div className="space-y-6">
                {leaderboard.topLongest.map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {i + 1}
                      </div>
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={entry.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate max-w-[120px]" title={entry.displayName}>
                        {entry.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {entry.longestStreak}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Streaks */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="w-5 h-5 text-orange-500" />
              Current Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!leaderboard?.topCurrent.length ? (
              <div className="text-center py-8 text-muted-foreground">No data yet</div>
            ) : (
              <div className="space-y-6">
                {leaderboard.topCurrent.map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {i + 1}
                      </div>
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={entry.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate max-w-[120px]" title={entry.displayName}>
                        {entry.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-sm bg-muted/50 px-2 py-1 rounded">
                      <Flame className="w-3.5 h-3.5 text-orange-500" />
                      {entry.currentStreak}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fastest Today */}
        <Card className="border-border shadow-sm">
          <CardHeader className="bg-muted/30 pb-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Timer className="w-5 h-5 text-primary" />
              Fastest Today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {!leaderboard?.fastestToday.length ? (
              <div className="text-center py-8 text-muted-foreground">No solvers yet today</div>
            ) : (
              <div className="space-y-6">
                {leaderboard.fastestToday.map((entry, i) => (
                  <div key={entry.userId} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-6 text-center text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {i === 0 ? <Medal className="w-4 h-4 text-yellow-500 mx-auto" /> : i + 1}
                      </div>
                      <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={entry.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                          {entry.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm truncate max-w-[120px]" title={entry.displayName}>
                        {entry.displayName}
                      </span>
                    </div>
                    <div className="font-mono text-sm bg-primary/10 text-primary px-2 py-1 rounded font-medium">
                      {formatTime(entry.solveTimeMs)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
