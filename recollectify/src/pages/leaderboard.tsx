import { useGetLeaderboard, useGetGlobalStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Trophy, Users, CheckCircle2, User, Crown } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard();
  const { data: stats, isLoading: statsLoading } = useGetGlobalStats();

  if (leaderboardLoading || statsLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto space-y-8 pb-8"
    >
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-serif tracking-tight">Global Leaderboard</h1>
        <p className="text-muted-foreground">The most resilient memories.</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Players" value={stats.totalPlayers} />
          <StatCard icon={User} label="Players Today" value={stats.playersToday} />
          <StatCard icon={CheckCircle2} label="Successes Today" value={stats.successesToday} />
          <StatCard icon={Crown} label="Best Streak Ever" value={stats.longestStreakEver} highlight />
        </div>
      )}

      {leaderboard && (
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px] mx-auto mb-8">
            <TabsTrigger value="current">Current Streak</TabsTrigger>
            <TabsTrigger value="longest">All-Time Best</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current" className="mt-0">
            <LeaderboardList entries={leaderboard.topCurrent} type="current" />
          </TabsContent>
          <TabsContent value="longest" className="mt-0">
            <LeaderboardList entries={leaderboard.topLongest} type="longest" />
          </TabsContent>
        </Tabs>
      )}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, highlight = false }: { icon: any, label: string, value: number, highlight?: boolean }) {
  return (
    <Card className={`border-border/50 bg-card/40 backdrop-blur shadow-sm ${highlight ? 'border-primary/20 ring-1 ring-primary/10' : ''}`}>
      <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
        <Icon className={`w-5 h-5 mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground/60'}`} />
        <div className={`text-2xl font-serif font-medium mb-1 ${highlight ? 'text-foreground' : 'text-foreground'}`}>
          {value.toLocaleString()}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium leading-tight">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardList({ entries, type }: { entries: any[], type: "current" | "longest" }) {
  if (entries.length === 0) {
    return (
      <Card className="border-dashed border-2 bg-transparent shadow-none">
        <CardContent className="py-12 flex flex-col items-center justify-center text-muted-foreground">
          <Trophy className="w-12 h-12 mb-4 opacity-20" />
          <p>No entries yet. Be the first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-border/50 overflow-hidden">
      <div className="divide-y divide-border/40">
        {entries.map((entry, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={`${entry.userId}-${i}`} 
            className="flex items-center p-4 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 mr-4 shrink-0">
              {i === 0 ? (
                <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-600 flex items-center justify-center ring-2 ring-yellow-500/30">
                  <Crown className="w-4 h-4" />
                </div>
              ) : i === 1 ? (
                <div className="w-8 h-8 rounded-full bg-slate-300/20 text-slate-500 flex items-center justify-center font-bold font-serif">
                  2
                </div>
              ) : i === 2 ? (
                <div className="w-8 h-8 rounded-full bg-amber-700/10 text-amber-700/80 flex items-center justify-center font-bold font-serif">
                  3
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full text-muted-foreground/50 flex items-center justify-center font-medium text-sm">
                  {i + 1}
                </div>
              )}
            </div>
            
            <Avatar className="h-10 w-10 border border-border/50 mr-4 shrink-0 shadow-sm">
              {entry.profileImageUrl && <AvatarImage src={entry.profileImageUrl} alt={entry.displayName} />}
              <AvatarFallback className="bg-primary/5 text-primary">
                {entry.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">{entry.displayName}</div>
            </div>
            
            <div className="flex flex-col items-end shrink-0 ml-4">
              <div className="text-xl font-serif text-foreground font-medium">
                {type === "current" ? entry.currentStreak : entry.longestStreak}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {type === "current" ? "Current" : "Best"}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
