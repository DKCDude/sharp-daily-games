import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HowToPlayDialog({ mobile = false }: { mobile?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mobile ? (
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-left transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HelpCircle className="w-5 h-5" />
            How to Play
          </button>
        ) : (
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full text-left transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <HelpCircle className="w-5 h-5" />
            How to Play
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">How to Play</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm leading-relaxed">

          <section>
            <h3 className="font-semibold text-base mb-1">The basics</h3>
            <p className="text-muted-foreground">
              Crossnumbers is a daily math crossword. Fill every white cell so
              that every entry is a correct equation. Each entry runs either
              across or down, just like a regular crossword.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Two types of clue</h3>
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="font-medium mb-1">Equation → Answer</p>
                <p className="text-muted-foreground">
                  The full equation is shown (e.g. <span className="font-mono font-semibold">25 − 4</span>).
                  Fill in the numeric answer in the grid cells for that entry.
                </p>
                <p className="text-muted-foreground mt-1">
                  <span className="font-mono font-semibold">25 − 4</span> → type <span className="font-mono font-semibold">21</span>
                </p>
              </div>
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="font-medium mb-1">Make Equation</p>
                <p className="text-muted-foreground">
                  Only the target number is shown (e.g. <span className="font-mono font-semibold">Make 76</span>).
                  Fill in an equation — numbers and an operator — that equals
                  that target. The cell lengths tell you the exact format.
                </p>
                <p className="text-muted-foreground mt-1">
                  <span className="font-mono font-semibold">Make 76</span> → type <span className="font-mono font-semibold">4 × 19</span> or <span className="font-mono font-semibold">38 + 38</span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Operators</h3>
            <p className="text-muted-foreground">
              Use the operator buttons below the grid (+ − × ÷) to enter an
              operator into a cell. On a physical keyboard you can type{" "}
              <span className="font-mono">+</span>,{" "}
              <span className="font-mono">-</span>,{" "}
              <span className="font-mono">*</span>, or{" "}
              <span className="font-mono">/</span>.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Navigation</h3>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Click or tap a cell to select it.</li>
              <li>Click the same cell again to flip between Across and Down.</li>
              <li>Arrow keys move the cursor in the grid.</li>
              <li>Backspace clears the current cell and moves back.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">Difficulty</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-xs">
              <span className="font-medium text-foreground">Monday / Tuesday</span>
              <span>1-digit numbers, + and −</span>
              <span className="font-medium text-foreground">Wednesday / Thursday</span>
              <span>2-digit numbers, +, −, ×</span>
              <span className="font-medium text-foreground">Friday</span>
              <span>2-digit numbers, all four operators</span>
              <span className="font-medium text-foreground">Saturday / Sunday</span>
              <span>3-digit numbers, all four operators, no hints</span>
            </div>
            <p className="text-muted-foreground mt-2">
              On easier days some crossing cells are pre-filled as hints.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-1">Submitting</h3>
            <p className="text-muted-foreground">
              Press <span className="font-semibold">Submit Solution</span> when
              every cell is filled. Incorrect cells are highlighted in red —
              keep solving until everything is correct. Your time is recorded
              from your first keystroke to a correct submission.
            </p>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  );
}
