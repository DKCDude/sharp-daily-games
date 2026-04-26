import { useState, useEffect, useCallback, useRef } from "react";
import { 
  useGetCrossnumbersState, 
  useGetCrossnumbersPuzzle,
  useSubmitCrossnumbers,
  useSaveCrossnumbersProgress,
  getGetCrossnumbersStateQueryKey,
  getGetCrossnumbersPuzzleQueryKey,
  getGetCrossnumbersHistoryQueryKey,
  getGetCrossnumbersLeaderboardQueryKey,
  getGetCrossnumbersStatsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  createPlayerGrid, 
  setPlayerCell, 
  clearPlayerCell, 
  getEntriesForCell, 
  buildShareText,
  DIFFICULTY
} from "@workspace/crossnumbers-engine";
import { Card, CardContent } from "@/components/ui/card";
import { Scratchpad } from "@/components/scratchpad";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Share2, CheckCircle2, Play, Flame, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Format ms into MM:SS
function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const displayOp = (op: string) => {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op;
};

export default function HomePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: state, isLoading: stateLoading } = useGetCrossnumbersState({
    query: { queryKey: getGetCrossnumbersStateQueryKey() }
  });
  const { data: puzzle, isLoading: puzzleLoading } = useGetCrossnumbersPuzzle({
    query: { queryKey: getGetCrossnumbersPuzzleQueryKey() }
  });
  const submitPuzzle = useSubmitCrossnumbers();
  const saveProgress = useSaveCrossnumbersProgress();

  const [playerGrid, setPlayerGrid] = useState<any[][] | null>(null);
  const [cursor, setCursor] = useState<{ row: number; col: number; dir: 'across' | 'down' } | null>(null);
  
  // Timer state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Initialize grid from local storage or create new
  useEffect(() => {
    if (!puzzle || !state) return;
    
    if (state.attemptStatus === 'solved') {
      setIsRunning(false);
      setElapsedMs(state.solveTimeMs || 0);
      return; // backend doesn't return playerGrid on state, assume we don't show the filled grid if solved, or we do? The prompt says: "Solved-state shows time, streak update, and a Share button".
    }

    let initialGrid = createPlayerGrid(puzzle as any);

    // Prefer server-saved progress (cross-device); fall back to localStorage (offline).
    const serverGrid = (state as any)?.playerGrid;
    if (
      Array.isArray(serverGrid) &&
      serverGrid.length === puzzle.size &&
      serverGrid.every((row: any) => Array.isArray(row) && row.length === puzzle.size)
    ) {
      initialGrid = serverGrid;
    } else {
      const lsKey = `crossnumbers_${puzzle.date}`;
      const saved = localStorage.getItem(lsKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length === puzzle.size) {
            initialGrid = parsed;
          }
        } catch(e) {}
      }
    }

    setPlayerGrid(initialGrid);
    
    // Find first playable cell for cursor
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        if (puzzle.grid[r][c].type !== 'black') {
          setCursor({ row: r, col: c, dir: 'across' });
          return;
        }
      }
    }
  }, [puzzle, state]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        if (startTimeRef.current) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const startTimer = useCallback(() => {
    if (!isRunning && state?.attemptStatus !== 'solved') {
      setIsRunning(true);
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - elapsedMs;
      }
    }
  }, [isRunning, state, elapsedMs]);

  // Persist grid changes: localStorage immediately (offline fallback) +
  // debounced server autosave so progress follows the player across devices.
  const autosaveTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!playerGrid || !puzzle) return;
    try {
      localStorage.setItem(`crossnumbers_${puzzle.date}`, JSON.stringify(playerGrid));
    } catch {}

    if (state?.attemptStatus === 'solved') return;
    if (autosaveTimerRef.current !== null) {
      clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      saveProgress.mutate({
        data: {
          playerGrid: playerGrid.map((row: any[]) =>
            row.map((cell: any) => ({ value: cell?.value ?? null })),
          ),
        },
      });
    }, 800);
    return () => {
      if (autosaveTimerRef.current !== null) clearTimeout(autosaveTimerRef.current);
    };
  }, [playerGrid, puzzle, state?.attemptStatus, saveProgress]);

  const moveCursor = useCallback((dRow: number, dCol: number) => {
    if (!puzzle || !cursor) return;
    let r = cursor.row + dRow;
    let c = cursor.col + dCol;
    
    while (r >= 0 && r < puzzle.size && c >= 0 && c < puzzle.size) {
      if (puzzle.grid[r][c].type !== 'black') {
        setCursor(prev => prev ? { ...prev, row: r, col: c } : null);
        return;
      }
      r += dRow;
      c += dCol;
    }
  }, [puzzle, cursor]);

  const handleCellClick = (r: number, c: number) => {
    if (puzzle?.grid[r][c].type === 'black') return;
    setValidationErrors([]);
    setCursor(prev => {
      if (prev?.row === r && prev?.col === c) {
        return { row: r, col: c, dir: prev.dir === 'across' ? 'down' : 'across' };
      }
      return { row: r, col: c, dir: prev?.dir || 'across' };
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!puzzle || !playerGrid || !cursor || state?.attemptStatus === 'solved') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const cell = puzzle.grid[cursor.row][cursor.col];
    startTimer();
    setValidationErrors([]);

    const isValidChar = (char: string) => {
      if (cell.type === 'digit') return /^[0-9]$/.test(char);
      if (cell.type === 'operator') return /^[+\-*/]$/.test(char);
      return false;
    };

    if (isValidChar(e.key)) {
      const newGrid = [...playerGrid.map(r => [...r])];
      if (setPlayerCell(newGrid, cursor.row, cursor.col, e.key)) {
        setPlayerGrid(newGrid);
        moveCursor(cursor.dir === 'across' ? 0 : 1, cursor.dir === 'across' ? 1 : 0);
      }
    } else if (e.key === 'Backspace') {
      const newGrid = [...playerGrid.map(r => [...r])];
      if (playerGrid[cursor.row][cursor.col]?.value) {
        clearPlayerCell(newGrid, cursor.row, cursor.col);
        setPlayerGrid(newGrid);
      } else {
        moveCursor(cursor.dir === 'across' ? 0 : -1, cursor.dir === 'across' ? -1 : 0);
      }
    } else if (e.key === 'ArrowUp') {
      moveCursor(-1, 0);
    } else if (e.key === 'ArrowDown') {
      moveCursor(1, 0);
    } else if (e.key === 'ArrowLeft') {
      moveCursor(0, -1);
    } else if (e.key === 'ArrowRight') {
      moveCursor(0, 1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple toggle dir or move to next clue if possible
      setCursor(prev => prev ? { ...prev, dir: prev.dir === 'across' ? 'down' : 'across' } : null);
    }
  }, [puzzle, playerGrid, cursor, state, moveCursor, startTimer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSubmit = () => {
    if (!playerGrid || !puzzle || state?.attemptStatus === 'solved') return;
    
    // Check if fully filled
    let isFilled = true;
    for (let r=0; r<puzzle.size; r++) {
      for (let c=0; c<puzzle.size; c++) {
        if (puzzle.grid[r][c].type !== 'black' && !playerGrid[r][c].value) {
          isFilled = false;
        }
      }
    }

    if (!isFilled) {
      toast({
        title: "Incomplete grid",
        description: "Please fill all white squares before submitting.",
        variant: "destructive"
      });
      return;
    }

    setIsRunning(false);
    
    submitPuzzle.mutate({
      data: {
        playerGrid: playerGrid.map(row => row.map(cell => ({ value: cell.value }))),
        solveTimeMs: elapsedMs
      }
    }, {
      onSuccess: (res) => {
        if (res.solved) {
          queryClient.invalidateQueries({ queryKey: getGetCrossnumbersStateQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCrossnumbersHistoryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCrossnumbersLeaderboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCrossnumbersStatsQueryKey() });
          localStorage.removeItem(`crossnumbers_${puzzle.date}`);
          toast({
            title: "Puzzle Solved!",
            description: `Completed in ${formatTime(elapsedMs)}`,
          });
        } else {
          setIsRunning(true);
          setValidationErrors(res.errors);
          toast({
            title: "Incorrect solution",
            description: "There are some errors in your grid.",
            variant: "destructive"
          });
        }
      },
      onError: () => {
        setIsRunning(true);
        toast({
          title: "Submission failed",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  const handleShare = () => {
    if (!puzzle || !playerGrid || !state) return;
    // We pass what we have; buildShareText handles partial puzzle info
    const text = buildShareText(puzzle as any, playerGrid, Math.floor(elapsedMs / 1000));
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Share your results with friends!",
    });
  };

  const isErrorCell = (r: number, c: number) => {
    if (!puzzle || validationErrors.length === 0) return false;
    const entries = getEntriesForCell(puzzle as any, r, c);
    return entries.some((e: any) => validationErrors.some(err => err.entryId === e.id));
  };

  if (stateLoading || puzzleLoading) {
    return <div className="flex items-center justify-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!puzzle || !state) {
    return <div className="text-center py-12">Failed to load puzzle.</div>;
  }

  const isSolved = state.attemptStatus === 'solved';

  return (
    <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-[1fr_300px] lg:gap-8 items-start animate-in fade-in duration-500 pb-12">
      
      {/* Left Column: Grid & Controls */}
      <div className="space-y-6 flex flex-col items-center lg:items-end">
        <div className="w-full flex items-center justify-between lg:justify-end gap-6 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm font-medium">
            <span className="text-muted-foreground">{puzzle.dayName}</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xl tabular-nums tracking-tight">
            {formatTime(elapsedMs)}
          </div>
        </div>

        {/* Grid */}
        <div 
          className="relative bg-foreground border-4 border-foreground"
          style={{ 
            display: 'grid', 
            gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`,
            gap: '2px',
            width: '100%',
            maxWidth: '500px',
            aspectRatio: '1/1'
          }}
        >
          {puzzle.grid.map((row, r) => 
            row.map((cell, c) => {
              if (cell.type === 'black') {
                return <div key={`${r}-${c}`} className="bg-foreground w-full h-full" />;
              }

              const pCell = playerGrid?.[r]?.[c];
              const isFocused = cursor?.row === r && cursor?.col === c;
              const hasError = isErrorCell(r, c);
              const val = pCell?.value || "";

              return (
                <div 
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={cn(
                    "relative bg-card flex items-center justify-center cursor-pointer transition-colors duration-150 select-none",
                    isFocused && !isSolved && "bg-yellow-300 ring-2 ring-yellow-500 ring-inset",
                    hasError && "bg-red-200 ring-2 ring-red-400 ring-inset",
                    isSolved && "bg-card text-primary cursor-default"
                  )}
                >
                  {cell.number && (
                    <span className="absolute top-0.5 left-1 text-[10px] md:text-xs font-bold text-muted-foreground leading-none">
                      {cell.number}
                    </span>
                  )}
                  {cell.given && (
                    <div className="absolute inset-0 bg-muted/30 pointer-events-none" />
                  )}
                  <span className={cn(
                    "text-xl md:text-3xl font-bold z-10",
                    cell.type === 'operator' && "text-primary",
                    val && "animate-in zoom-in-75 duration-150"
                  )}>
                    {cell.type === 'operator' && val ? displayOp(val) : val}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Keyboard / Keypad for Mobile */}
        {!isSolved && (
          <div className="w-full max-w-[500px] mt-6 grid gap-2">
            {puzzle && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {DIFFICULTY.find(d => d.name === puzzle.dayName)?.operators.map(op => (
                  <Button
                    key={op}
                    variant="outline"
                    size="lg"
                    className="h-14 text-2xl font-bold"
                    onClick={() => {
                      if (!cursor || !playerGrid) return;
                      const cell = puzzle.grid[cursor.row][cursor.col];
                      if (cell.type !== 'operator' || cell.given) return;
                      
                      startTimer();
                      setValidationErrors([]);
                      const newGrid = [...playerGrid.map(r => [...r])];
                      if (setPlayerCell(newGrid, cursor.row, cursor.col, op)) {
                        setPlayerGrid(newGrid);
                        moveCursor(cursor.dir === 'across' ? 0 : 1, cursor.dir === 'across' ? 1 : 0);
                      }
                    }}
                  >
                    {displayOp(op)}
                  </Button>
                ))}
              </div>
            )}
             <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold"
                onClick={handleSubmit}
                disabled={submitPuzzle.isPending}
              >
                {submitPuzzle.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Submit Solution
              </Button>
          </div>
        )}

        {isSolved && (
          <Card className="w-full max-w-[500px] border-primary/20 bg-primary/5 shadow-sm mt-4 animate-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Puzzle Solved!</h3>
              
              <div className="flex items-center justify-center gap-6 py-2">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Time</div>
                  <div className="text-xl font-mono font-bold">{formatTime(state.solveTimeMs || elapsedMs)}</div>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium mb-1">Streak</div>
                  <div className="text-xl font-bold flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-orange-500" />
                    {state.currentStreak}
                  </div>
                </div>
              </div>

              <Button onClick={handleShare} className="w-full group mt-2" variant="default" size="lg">
                <Share2 className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Share Result
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column: Clues */}
      <div className="space-y-6">
        <Card className="border-border shadow-sm h-full">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-bold text-lg">Across</h3>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[30vh] lg:max-h-[35vh]">
              {(puzzle.clues ?? []).filter(c => c.direction === 'across').map(c => {
                const isActive = cursor?.dir === 'across' && getEntriesForCell(puzzle as any, cursor.row, cursor.col).some((e:any) => e.id === c.id);
                return (
                  <div 
                    key={c.id} 
                    className={cn(
                      "flex gap-3 text-sm cursor-pointer p-2 -mx-2 rounded hover:bg-muted/50 transition-colors",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setCursor({ row: c.row, col: c.col, dir: 'across' });
                    }}
                  >
                    <span className="font-bold w-4 shrink-0 text-right">{c.number}</span>
                    <span>{c.clueType === 'make-equation' ? `Make ${c.clue}` : c.clue.replace(/([+\-*/])/g, m => displayOp(m))}</span>
                  </div>
                )
              })}
            </div>
            
            <div className="p-4 border-y border-border bg-muted/30">
              <h3 className="font-bold text-lg">Down</h3>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[30vh] lg:max-h-[35vh] flex-1">
              {(puzzle.clues ?? []).filter(c => c.direction === 'down').map(c => {
                const isActive = cursor?.dir === 'down' && getEntriesForCell(puzzle as any, cursor.row, cursor.col).some((e:any) => e.id === c.id);
                return (
                  <div 
                    key={c.id} 
                    className={cn(
                      "flex gap-3 text-sm cursor-pointer p-2 -mx-2 rounded hover:bg-muted/50 transition-colors",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setCursor({ row: c.row, col: c.col, dir: 'down' });
                    }}
                  >
                    <span className="font-bold w-4 shrink-0 text-right">{c.number}</span>
                    <span>{c.clueType === 'make-equation' ? `Make ${c.clue}` : c.clue.replace(/([+\-*/])/g, m => displayOp(m))}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>

        <Scratchpad />
      </div>

    </div>
  );
}
