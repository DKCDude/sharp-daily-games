import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Eraser } from "lucide-react";

const STORAGE_KEY = "crossnumbers_scratchpad";

const SAFE_EXPR = /^[0-9+\-*/().\s]+$/;

function evaluate(expr: string): string | null {
  const trimmed = expr.trim();
  if (!trimmed) return null;
  if (!SAFE_EXPR.test(trimmed)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${trimmed});`)();
    if (typeof result !== "number" || !Number.isFinite(result)) return null;
    return Number.isInteger(result)
      ? String(result)
      : String(Math.round(result * 1e6) / 1e6);
  } catch {
    return null;
  }
}

function formatLine(line: string): string {
  const eqIdx = line.lastIndexOf("=");
  if (eqIdx === -1) return line;
  const lhs = line.slice(0, eqIdx);
  const rhs = line.slice(eqIdx + 1);
  if (rhs.trim() !== "") return line;
  const result = evaluate(lhs);
  if (result === null) return line;
  return `${lhs}=${result}`;
}

export function Scratchpad() {
  const [text, setText] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {}
  }, [text]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();

    const ta = e.currentTarget;
    const { selectionStart, selectionEnd, value } = ta;

    if (e.key === "=" && selectionStart === selectionEnd) {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEnd = value.indexOf("\n", selectionStart);
      const endIdx = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.slice(lineStart, selectionStart);

      if (
        currentLine.trim() &&
        !currentLine.includes("=") &&
        SAFE_EXPR.test(currentLine)
      ) {
        const result = evaluate(currentLine);
        if (result !== null) {
          e.preventDefault();
          const before = value.slice(0, selectionStart);
          const after = value.slice(endIdx);
          const insertion = `=${result}`;
          const next = `${before}${insertion}${after}`;
          setText(next);
          requestAnimationFrame(() => {
            const pos = (before + insertion).length;
            ta.setSelectionRange(pos, pos);
          });
          return;
        }
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const lineEnd = value.indexOf("\n", selectionStart);
      const endIdx = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.slice(lineStart, endIdx);
      const formatted = formatLine(currentLine);
      if (formatted !== currentLine) {
        e.preventDefault();
        const next =
          value.slice(0, lineStart) +
          formatted +
          "\n" +
          value.slice(endIdx);
        setText(next);
        requestAnimationFrame(() => {
          const pos = lineStart + formatted.length + 1;
          ta.setSelectionRange(pos, pos);
        });
      }
    }
  };

  return (
    <Card className="border-border shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Scratchpad</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => setText("")}
          title="Clear scratchpad"
        >
          <Eraser className="w-3 h-3 mr-1" />
          Clear
        </Button>
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        placeholder={"Try it: type 2+2= and the answer appears.\nOne expression per line."}
        className="w-full h-40 p-3 bg-transparent font-mono text-sm resize-none outline-none placeholder:text-muted-foreground/60"
      />
      <div className="px-3 pb-2 text-[10px] text-muted-foreground">
        Tip: end any line with <span className="font-mono">=</span> to evaluate.
        Operators: <span className="font-mono">+ − × ÷</span> (use <span className="font-mono">* /</span>).
      </div>
    </Card>
  );
}
