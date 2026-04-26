import { useAuth } from "@workspace/replit-auth-web";
import { useGetGameState, getGetGameStateQueryKey, useStartReveal, useSubmitGuess, useGetTodayWord } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PlayCircle, Trophy, BookOpen, AlertCircle, CheckCircle2, ChevronRight, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DailyReminderCard, useScheduleReminder } from "@/components/daily-reminder";

export default function Home() {
  const { isAuthenticated, login, isLoading: authLoading } = useAuth();
  useScheduleReminder();
  
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeen = localStorage.getItem("recollectify_seen_intro");
      if (!hasSeen && isAuthenticated) {
        setShowHowToPlay(true);
        localStorage.setItem("recollectify_seen_intro", "true");
      }
    }
  }, [isAuthenticated]);

  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif">Recollectify</CardTitle>
            <CardDescription className="text-base mt-2">
              A calm, focused daily memory ritual.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground pb-8">
            <p>Every day a single word is revealed.</p>
            <p>Your task: recall every word from your streak, in order, ending with today's.</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => login()}>
              Sign in to play
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full relative">
      <div className="absolute top-0 right-0 p-2 z-10">
        <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">How to Play</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to Play Recollectify</DialogTitle>
              <DialogDescription>
                Your daily memory ritual.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm text-foreground/80">
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0"><PlayCircle className="w-4 h-4" /></div>
                <div>
                  <p className="font-medium text-foreground">1. Reveal</p>
                  <p>Each day, you get a few seconds to look at the Word of the Day.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0"><BookOpen className="w-4 h-4" /></div>
                <div>
                  <p className="font-medium text-foreground">2. Recall</p>
                  <p>Type in every word from your current streak in order, ending with today's new word.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0"><Trophy className="w-4 h-4" /></div>
                <div>
                  <p className="font-medium text-foreground">3. Grow</p>
                  <p>Get it right to grow your streak. Miss one word, and your streak resets to zero.</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <GameEngine />
    </div>
  );
}

function GameEngine() {
  const queryClient = useQueryClient();
  const { data: gameState, isLoading, isError } = useGetGameState();
  const startRevealMutation = useStartReveal();
  const submitGuessMutation = useSubmitGuess();

  // Local state to manage the transition from "revealing" to "recalling"
  const [localPhase, setLocalPhase] = useState<string | null>(null);

  useEffect(() => {
    if (gameState) {
      if (gameState.phase === "revealing" && localPhase !== "recalling") {
        setLocalPhase("revealing");
      } else if (gameState.phase !== "revealing") {
        setLocalPhase(gameState.phase);
      }
    }
  }, [gameState?.phase, localPhase]);

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (isError || !gameState) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center text-center text-destructive">
            <AlertCircle className="w-12 h-12 mb-4 opacity-80" />
            <p>Could not load game state.</p>
            <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleStartReveal = () => {
    startRevealMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
      }
    });
  };

  const handleRevealComplete = () => {
    setLocalPhase("recalling");
  };

  const handleSubmit = (words: string[]) => {
    submitGuessMutation.mutate({ data: { words } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGameStateQueryKey() });
      }
    });
  };

  const currentPhase = localPhase || gameState.phase;

  return (
    <div className="flex-1 flex items-center justify-center w-full max-w-md mx-auto p-4">
      <AnimatePresence mode="wait">
        {currentPhase === "idle" && (
          <PhaseIdle 
            key="idle" 
            gameState={gameState} 
            onStart={handleStartReveal} 
            isPending={startRevealMutation.isPending} 
          />
        )}
        {currentPhase === "revealing" && (
          <PhaseRevealing 
            key="revealing" 
            gameState={gameState} 
            onComplete={handleRevealComplete} 
          />
        )}
        {currentPhase === "recalling" && (
          <PhaseRecalling 
            key="recalling" 
            gameState={gameState} 
            onSubmit={handleSubmit}
            isPending={submitGuessMutation.isPending}
          />
        )}
        {currentPhase === "completed" && (
          <PhaseCompleted 
            key="completed" 
            gameState={gameState} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PhaseIdle({ gameState, onStart, isPending }: { gameState: any, onStart: () => void, isPending: boolean }) {
  const formattedDate = new Date(gameState.date).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full border-primary/10 shadow-xl overflow-hidden bg-card/80 backdrop-blur-sm">
        <div className="h-2 w-full bg-gradient-to-r from-primary/40 to-secondary/40" />
        <CardContent className="pt-10 pb-8 flex flex-col items-center text-center px-6">
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase mb-6">{formattedDate}</p>
          
          <div className="flex justify-center gap-8 mb-10 w-full">
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif text-primary">{gameState.currentStreak}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Current</span>
            </div>
            <div className="w-px h-12 bg-border/60"></div>
            <div className="flex flex-col items-center">
              <span className="text-4xl font-serif text-muted-foreground">{gameState.longestStreak}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Best</span>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-medium shadow-md group relative overflow-hidden" 
            onClick={onStart}
            disabled={isPending}
          >
            <span className="relative z-10 flex items-center gap-2">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Reveal Today's Word"}
            </span>
          </Button>
          
          <p className="mt-6 text-sm text-muted-foreground/80 max-w-[250px]">
            You'll have a few seconds to memorize the new word.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhaseRevealing({ gameState, onComplete }: { gameState: any, onComplete: () => void }) {
  const { data: wordData, isLoading } = useGetTodayWord({ query: { refetchInterval: false as const, queryKey: ["today-word"] } });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const duration = gameState.revealDurationMs || 4000;
  
  useEffect(() => {
    if (!gameState.revealEndsAt) return;
    
    const endsAt = new Date(gameState.revealEndsAt).getTime();
    
    const tick = () => {
      const now = Date.now();
      const remaining = Math.max(0, endsAt - now);
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onComplete();
      }
    };
    
    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [gameState.revealEndsAt, onComplete]);

  const progress = timeLeft !== null ? (timeLeft / duration) * 100 : 100;

  if (isLoading || !wordData?.word) {
    return <div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="w-full border-primary/20 shadow-2xl relative overflow-hidden bg-card">
        <div 
          className="absolute top-0 left-0 h-1 bg-primary transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />
        <CardContent className="pt-16 pb-16 flex flex-col items-center justify-center min-h-[300px]">
          <span className="text-sm text-muted-foreground uppercase tracking-widest mb-8">Memorize</span>
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl sm:text-6xl font-serif text-foreground tracking-tight text-center break-all px-4"
          >
            {wordData.word}
          </motion.h2>
          
          <div className="absolute bottom-6 flex justify-center w-full">
            <div className="w-12 h-12 rounded-full border-4 border-muted flex items-center justify-center">
              <span className="font-mono text-sm font-medium">
                {Math.ceil((timeLeft || 0) / 1000)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhaseRecalling({ gameState, onSubmit, isPending }: { gameState: any, onSubmit: (words: string[]) => void, isPending: boolean }) {
  const count = gameState.sequenceLength;
  const [words, setWords] = useState<string[]>(Array(count).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isComplete = words.every(w => w.trim().length > 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' && words[index].trim()) {
      e.preventDefault();
      if (index < count - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (isComplete && !isPending) {
        onSubmit(words.map(w => w.trim()));
      }
    } else if (e.key === 'Backspace' && !words[index] && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleChange = (val: string, index: number) => {
    const newWords = [...words];
    newWords[index] = val;
    setWords(newWords);
  };

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="w-full border-border shadow-lg">
        <CardHeader className="text-center pb-2">
          <CardTitle className="font-serif text-xl">Recall Sequence</CardTitle>
          <CardDescription>Type the words in order.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 pb-6 space-y-4">
          <div className="space-y-3">
            {words.map((word, i) => (
              <div key={i} className="relative">
                {i === count - 1 && (
                  <div className="absolute -top-2 right-2 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold pointer-events-none z-10">
                    Today
                  </div>
                )}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                  {i + 1}
                </div>
                <Input
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  value={word}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  disabled={isPending}
                  className="pl-12 h-12 text-lg font-medium"
                  placeholder={i === count - 1 ? "Today's word..." : "Previous word..."}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  autoCapitalize="off"
                />
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full h-12 mt-6 text-base" 
            disabled={!isComplete || isPending}
            onClick={() => onSubmit(words.map(w => w.trim()))}
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Sequence"}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PhaseCompleted({ gameState }: { gameState: any }) {
  const isCorrect = gameState.lastResult === "correct";
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full"
    >
      <Card className={`w-full overflow-hidden shadow-xl ${isCorrect ? 'border-primary/30' : 'border-destructive/30'}`}>
        <div className={`h-2 w-full ${isCorrect ? 'bg-primary' : 'bg-destructive/80'}`} />
        
        <CardContent className="pt-10 pb-8 flex flex-col items-center text-center px-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isCorrect ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            {isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
          </div>
          
          <h2 className="text-3xl font-serif mb-2">
            {isCorrect ? "Brilliant." : "Streak Broken."}
          </h2>
          
          <p className="text-muted-foreground mb-8 max-w-[280px]">
            {isCorrect 
              ? "You correctly recalled the sequence. See you tomorrow for the next word." 
              : "Memory is a muscle. Tomorrow is a new beginning."}
          </p>
          
          <div className="w-full bg-muted/50 rounded-xl p-4 mb-6 flex justify-around items-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-serif text-foreground">{gameState.currentStreak}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Streak</span>
            </div>
            <div className="w-px h-8 bg-border"></div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-serif text-muted-foreground">{gameState.longestStreak}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Best</span>
            </div>
          </div>
          
          {gameState.quote && (
            <div className="mt-4 mb-6 italic text-sm text-foreground/70 border-l-2 border-primary/30 pl-4 py-1 text-left self-start">
              "{gameState.quote}"
              {gameState.quoteAuthor && <span className="block mt-2 text-xs not-italic font-medium text-muted-foreground">— {gameState.quoteAuthor}</span>}
            </div>
          )}

          <DailyReminderCard />
        </CardContent>
      </Card>
    </motion.div>
  );
}
