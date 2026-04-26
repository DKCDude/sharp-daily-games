import { useGetStreakHistory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Activity, AlertCircle, History } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";

export default function Streak() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: history, isLoading: historyLoading, isError } = useGetStreakHistory();

  if (authLoading || historyLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isError || !history) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center text-destructive">
            <AlertCircle className="w-12 h-12 mb-4 opacity-80" />
            <p>Could not load streak history.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <Activity className="w-6 h-6 text-primary mb-2 opacity-80" />
            <div className="text-4xl font-serif text-primary mb-1">{history.currentStreak}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Current Streak</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/50 backdrop-blur-sm shadow-sm">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <History className="w-6 h-6 text-muted-foreground mb-2 opacity-60" />
            <div className="text-4xl font-serif text-foreground mb-1">{history.longestStreak}</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Longest Streak</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-4 border-b border-border/40">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            Current Sequence
          </CardTitle>
          <CardDescription>
            The words you've recalled to build your current streak.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {history.words.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Activity className="w-12 h-12 mb-4 opacity-20" />
              <p>Your streak starts tomorrow.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] w-full rounded-b-xl">
              <div className="p-6">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:ml-[2.25rem] md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                  {history.words.map((item, index) => {
                    const formattedDate = new Date(item.date).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric'
                    });
                    
                    return (
                      <motion.div 
                        key={item.date}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full border-4 border-background bg-muted-foreground/20 text-muted-foreground text-xs font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/20 transition-colors ml-0 md:ml-0 md:mx-auto">
                          {item.index}
                        </div>
                        
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow hover:border-primary/30">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground/70 uppercase tracking-wider mb-1">{formattedDate}</span>
                            <span className="text-lg font-medium text-foreground tracking-tight">{item.word}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
