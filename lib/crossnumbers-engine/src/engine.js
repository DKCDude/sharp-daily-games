// =============================================================================
// CROSSNUMBERS ENGINE
// Core puzzle generation, validation, and daily scheduling logic.
// Drop this file into your Replit project and import the functions you need.
// =============================================================================


// =============================================================================
// SECTION 1: DIFFICULTY SETTINGS
// Controls what each day of the week allows.
// Monday = 0, Sunday = 6
// =============================================================================

const DIFFICULTY = [
  {
    // Monday
    name: "Monday",
    maxDigits: 1,          // each number in an equation is at most 1 digit (1–9)
    operators: ["+", "-"], // only addition and subtraction
    makeEqRatio: 0.3,      // 30% of clues are "make an equation" type
    givenDigits: 0.5,      // 50% of crossing digit cells are pre-revealed as hints
  },
  {
    // Tuesday
    name: "Tuesday",
    maxDigits: 1,
    operators: ["+", "-"],
    makeEqRatio: 0.4,
    givenDigits: 0.3,
  },
  {
    // Wednesday
    name: "Wednesday",
    maxDigits: 2,          // numbers can now be 10–99
    operators: ["+", "-", "*"],
    makeEqRatio: 0.5,
    givenDigits: 0.2,
  },
  {
    // Thursday
    name: "Thursday",
    maxDigits: 2,
    operators: ["+", "-", "*"],
    makeEqRatio: 0.5,
    givenDigits: 0.1,
  },
  {
    // Friday
    name: "Friday",
    maxDigits: 2,
    operators: ["+", "-", "*", "/"],
    makeEqRatio: 0.6,
    givenDigits: 0,
  },
  {
    // Saturday
    name: "Saturday",
    maxDigits: 3,          // numbers can now be 100–999
    operators: ["+", "-", "*", "/"],
    makeEqRatio: 0.7,
    givenDigits: 0,
  },
  {
    // Sunday
    name: "Sunday",
    maxDigits: 3,
    operators: ["+", "-", "*", "/"],
    makeEqRatio: 0.8,
    givenDigits: 0,
  },
];


// =============================================================================
// SECTION 2: SEEDED RANDOM NUMBER GENERATOR
// Same seed = same puzzle. We seed from the date so everyone gets the
// same puzzle each day, with no server needed.
// =============================================================================

function makeRng(seed) {
  // Mulberry32 — fast, good distribution, pure JS
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateToSeed(date = new Date()) {
  // Produces a stable integer from YYYYMMDD — same day anywhere in the world
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

function getDayOfWeek(date = new Date()) {
  // 0 = Monday, 6 = Sunday (JS getDay: 0=Sun so we adjust)
  return (date.getDay() + 6) % 7;
}

function getTodayDifficulty(date = new Date()) {
  return DIFFICULTY[getDayOfWeek(date)];
}


// =============================================================================
// SECTION 3: MATH UTILITIES
// =============================================================================

// Evaluate a simple two-operand expression: left OP right
// Returns the result, or null if invalid (e.g. division remainder, div by zero)
function evaluate(left, op, right) {
  switch (op) {
    case "+": return left + right;
    case "-": return left - right;
    case "*": return left * right;
    case "/":
      if (right === 0) return null;
      if (left % right !== 0) return null; // only whole number division
      return left / right;
    default: return null;
  }
}

// How many cells does this entry occupy?
// Format: [digits of left][operator][digits of right]
// e.g. left=12, op="+", right=9  →  "12+9" = 4 cells
function entryLength(left, op, right) {
  return String(left).length + 1 + String(right).length;
}

// Split a result number into its digit array
// e.g. 142 → ["1","4","2"]
function digitCells(n) {
  return String(n).split("");
}

// Build the full cell array for an equation entry
// e.g. left=12, op="+", right=9  →  ["1","2","+","9"]
function buildEntryCells(left, op, right) {
  return [...digitCells(left), op, ...digitCells(right)];
}

// Build cell array for an equation-answer entry (pure digits)
// e.g. result=142 → ["1","4","2"]
function buildAnswerCells(result) {
  return digitCells(result);
}

// Generate a pool of valid (left, op, right) triples that:
//   - use only the allowed operators
//   - have numbers within the digit limit
//   - produce a positive integer result
//   - result fits within maxDigits too (so it can appear as an answer elsewhere)
//
// For small domains (1-digit: 9 values each) we enumerate everything.
// For larger domains we random-sample so generation stays under ~50ms even
// for Saturday/Sunday (3-digit operands = 900 × 900 × 4 ops = 3.2 M triples).
const MAX_EQUATIONS = 400;

function validEquations(difficulty, rng) {
  const { maxDigits, operators } = difficulty;
  const maxVal = Math.pow(10, maxDigits) - 1;
  const minVal = maxDigits === 1 ? 1 : Math.pow(10, maxDigits - 1);
  const rangeSize = maxVal - minVal + 1;

  // If the search space is small enough, enumerate exhaustively then shuffle.
  const spacePerOp = rangeSize * rangeSize;
  if (spacePerOp <= 10000) {
    const results = [];
    for (const op of operators) {
      const rightMin = op === "-" || op === "/" ? 1 : minVal;
      for (let left = minVal; left <= maxVal; left++) {
        for (let right = rightMin; right <= maxVal; right++) {
          const result = evaluate(left, op, right);
          if (result === null || result <= 0 || result > maxVal) continue;
          results.push({ left, op, right, result });
        }
      }
    }
    // Cap and shuffle so all difficulty settings have a similarly-sized pool.
    if (results.length > MAX_EQUATIONS) {
      shuffle(results, rng);
      results.length = MAX_EQUATIONS;
    }
    return results;
  }

  // Large domain: randomly sample until we have MAX_EQUATIONS valid triples.
  const results = [];
  const seen = new Set();
  const maxAttempts = MAX_EQUATIONS * 30; // avoid infinite loop
  for (let attempt = 0; attempt < maxAttempts && results.length < MAX_EQUATIONS; attempt++) {
    const op = operators[Math.floor(rng() * operators.length)];
    const rightMin = op === "-" || op === "/" ? 1 : minVal;
    const left  = minVal + Math.floor(rng() * rangeSize);
    const right = rightMin + Math.floor(rng() * (maxVal - rightMin + 1));
    const result = evaluate(left, op, right);
    if (result === null || result <= 0 || result > maxVal) continue;
    const key = `${left}${op}${right}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({ left, op, right, result });
  }
  return results;
}

// Pick a random item from an array using the seeded rng
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

// Shuffle an array in place using the seeded rng (Fisher-Yates)
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}


// =============================================================================
// SECTION 4: GRID STRUCTURE
// A grid is a 2D array of cells. Each cell is one of:
//   { type: "black" }                          — blocked square
//   { type: "digit", value: null, given: false } — player fills a digit
//   { type: "operator", value: null, given: false } — player fills an operator
// "given" means it's pre-revealed as a hint (easier difficulties only).
// =============================================================================

function makeGrid(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ type: "black" }))
  );
}

// Place an entry into the grid starting at (row, col) going in direction
// direction: "across" or "down"
// cells: array of strings like ["1","2","+","9"]
// entryType: "equation-answer" or "make-equation"
//
// Each cell in the grid records which direction first placed it
// (placedByDirection). A crossing is only valid when the PERPENDICULAR
// direction places the same value at that cell.  Two entries in the
// SAME direction must never share a cell — that would mean two across
// (or two down) entries share a run, which is illegal in a crossword.
function placeEntry(grid, row, col, direction, cells, entryType) {
  for (let i = 0; i < cells.length; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;

    const existing = grid[r][c];
    const isOp = cells[i] === "+" || cells[i] === "-" || cells[i] === "*" || cells[i] === "/";
    const cellType = isOp ? "operator" : "digit";

    if (existing.type === "black") {
      // Fresh cell — claim it for this direction.
      grid[r][c] = {
        type: cellType,
        value: cells[i],
        given: false,
        entryType,
        placedByDirection: direction,
      };
    } else {
      // Cell already white.  Reject if it was placed by the SAME direction
      // (two across entries or two down entries sharing a cell is forbidden).
      if (existing.placedByDirection === direction) {
        return false; // same-direction overlap — invalid crossword structure
      }
      // Valid perpendicular crossing: types and values must agree.
      if (existing.type !== cellType) {
        return false; // conflict: one entry needs digit, other needs operator
      }
      if (existing.value !== cells[i]) {
        return false; // conflict: different values required at same cell
      }
      grid[r][c].crossing = true;
    }
  }
  return true; // success
}

// Check whether an entry can be placed at (row,col) in direction with given length.
// Enforces three structural crossword rules:
//  1. BOUNDS: every cell of the entry lies inside the grid.
//  2. SEPARATOR: the cell immediately before the entry's start AND the cell
//     immediately after its end (in the same direction) must be black or
//     out-of-bounds.  This guarantees no two entries share a row/column run
//     without a black-cell gap, and that every entry spans its entire run.
//  3. PERPENDICULAR ISOLATION: any cell that would be newly made white (i.e.
//     is currently black) must have black-or-OOB neighbors in the
//     perpendicular direction.  This prevents accidental perpendicular runs
//     from appearing that have no equation assigned to them.
//     Cells that are already white are valid crossing candidates; their
//     type compatibility is checked separately by placeEntry().
function canPlaceEntry(grid, row, col, direction, length) {
  const SIZE = grid.length;

  // 1. Bounds
  const endR = direction === "across" ? row : row + length - 1;
  const endC = direction === "across" ? col + length - 1 : col;
  if (endR >= SIZE || endC >= SIZE) return false;

  // 2. Separator
  if (direction === "across") {
    if (col > 0 && grid[row][col - 1].type !== "black") return false;
    if (col + length < SIZE && grid[row][col + length].type !== "black") return false;
  } else {
    if (row > 0 && grid[row - 1][col].type !== "black") return false;
    if (row + length < SIZE && grid[row + length][col].type !== "black") return false;
  }

  // 3. Perpendicular isolation for newly-whitened cells
  for (let i = 0; i < length; i++) {
    const r = direction === "across" ? row : row + i;
    const c = direction === "across" ? col + i : col;
    if (grid[r][c].type !== "black") continue; // existing white cell = crossing, OK
    if (direction === "across") {
      if (r > 0 && grid[r - 1][c].type !== "black") return false;
      if (r + 1 < SIZE && grid[r + 1][c].type !== "black") return false;
    } else {
      if (c > 0 && grid[r][c - 1].type !== "black") return false;
      if (c + 1 < SIZE && grid[r][c + 1].type !== "black") return false;
    }
  }

  return true;
}


// =============================================================================
// SECTION 5: ENTRY DEFINITION
// An entry knows its position, direction, length, clue type, and answer.
// =============================================================================

function makeEntry(id, row, col, direction, clueType, left, op, right) {
  const result = evaluate(left, op, right);
  const cells = clueType === "make-equation"
    ? buildEntryCells(left, op, right)     // player writes the equation
    : buildAnswerCells(result);             // player writes only the digits

  const clue = clueType === "make-equation"
    ? String(result)                        // clue is the target number
    : `${left} ${displayOp(op)} ${right}`; // clue is the equation to solve

  return {
    id,
    row,
    col,
    direction,
    clueType,   // "make-equation" | "equation-answer"
    left,
    op,
    right,
    result,
    cells,      // what goes in the grid cells
    length: cells.length,
    clue,       // what the player sees in the clue list
    number: null, // assigned later (1-Across, 2-Down, etc.)
  };
}

function displayOp(op) {
  return { "+": "+", "-": "−", "*": "×", "/": "÷" }[op] || op;
}


// Check that all white cells in the grid form a single connected region.
// Puzzles with isolated islands are rejected — every entry must be reachable
// from every other entry by traversing adjacent white cells.
function isGridConnected(grid) {
  const rows = grid.length;
  const cols = grid[0].length;

  // Find the first white cell to start BFS from.
  let startR = -1, startC = -1;
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type !== "black") { startR = r; startC = c; break outer; }
    }
  }
  if (startR === -1) return true; // no white cells at all (degenerate, accept)

  // BFS
  const visited = new Set();
  const queue = [[startR, startC]];
  visited.add(startR * cols + startC);
  while (queue.length > 0) {
    const [r, c] = queue.pop();
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc].type === "black") continue;
      const key = nr * cols + nc;
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }

  // Compare to total white cell count.
  let total = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (grid[r][c].type !== "black") total++;

  return visited.size === total;
}


// =============================================================================
// SECTION 6: PUZZLE GENERATOR
// Builds a valid grid for a given date using structural crossword rules.
// Four invariants are maintained throughout generation:
//   • Separator rule    — no two same-direction entries touch (canPlaceEntry)
//   • Isolation rule    — no orphan perpendicular runs (canPlaceEntry)
//   • Crossing rule     — every entry (after the second) crosses ≥ 1 existing entry
//   • Connectivity rule — all white cells form one connected region (isGridConnected)
// These together guarantee: every white cell belongs to exactly the entry that
// placed it OR is a valid crossing of two entries, no entry is unconstrained,
// no entry runs longer than intended, and the puzzle has no isolated islands.
// =============================================================================

function generatePuzzle(date = new Date()) {
  const seed = dateToSeed(date);
  const rng = makeRng(seed);
  const difficulty = getTodayDifficulty(date);
  const dayIndex = getDayOfWeek(date);

  const gridSizes    = [5, 5, 7, 7, 9, 9, 11];
  const targetCounts = [6, 8, 10, 12, 14, 16, 18];
  const minCounts    = [4, 4,  6,  7,  8, 10, 12];
  const SIZE    = gridSizes[dayIndex];
  const target  = targetCounts[dayIndex];
  const minOk   = minCounts[dayIndex];

  const equations = validEquations(difficulty, rng);
  if (equations.length === 0) throw new Error("No valid equations for this difficulty");

  // Attempt generation up to 80 times with different shuffles.
  // Each attempt uses a deterministic sub-seed so the puzzle stays
  // reproducible for a given date while still exploring the space.
  for (let attempt = 0; attempt < 80; attempt++) {
    const aRng = makeRng(seed + attempt * 6271);
    const eqs  = [...equations];
    shuffle(eqs, aRng);

    const grid   = makeGrid(SIZE, SIZE);
    const placed = [];
    let entryId  = 0;

    // Track which clue strings have already been used so no two entries
    // show the same clue to the player (e.g. "41+20" appearing twice).
    const usedClues = new Set();

    // Build all candidate (row, col, direction) start positions and shuffle.
    const candidates = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        candidates.push({ row: r, col: c, direction: "across" });
        candidates.push({ row: r, col: c, direction: "down"   });
      }
    }
    shuffle(candidates, aRng);

    for (const { row, col, direction } of candidates) {
      if (placed.length >= target) break;

      // Try every equation and both clue-type orderings until one finds a
      // valid, non-duplicate placement.
      let committed = false;
      for (let ei = 0; ei < eqs.length && !committed; ei++) {
        const eq = eqs[ei];
        // Prefer the clue type that matches today's difficulty ratio first.
        const preferMake = aRng() < difficulty.makeEqRatio;
        const clueTypes  = preferMake ? [true, false] : [false, true];

        for (const isMakeEq of clueTypes) {
          const cells = isMakeEq
            ? buildEntryCells(eq.left, eq.op, eq.right)
            : buildAnswerCells(eq.result);
          const len = cells.length;

          // Skip single-cell entries — they're not valid crossword entries.
          if (len < 2) continue;

          // --- Deduplication: skip if this visible clue has already been used. ---
          // For equation-answer the clue text is the equation string ("41+20").
          // For make-equation the clue text is the target number ("61").
          // We key on the visual clue so the player never sees the same clue
          // twice (e.g. two "Make 7" entries, or two "41+20" entries).
          const eqResult = evaluate(eq.left, eq.op, eq.right);
          const clueKey = isMakeEq
            ? `make:${eqResult}`
            : `eq:${eq.left}${eq.op}${eq.right}`;
          if (usedClues.has(clueKey)) continue;

          // Rule 1 & 2: structural validity (separator + perpendicular isolation)
          if (!canPlaceEntry(grid, row, col, direction, len)) continue;

          // Rule 3: type/value conflict at existing crossing cells
          const testGrid = grid.map(rr => rr.map(cc => ({ ...cc })));
          const clueTypeStr = isMakeEq ? "make-equation" : "equation-answer";
          if (!placeEntry(testGrid, row, col, direction, cells, clueTypeStr)) continue;

          // Rule 4: require ≥ 1 crossing after the first two entries are placed.
          // This ensures every entry shares at least one cell with a perpendicular
          // entry, eliminating entries with infinitely many valid answers.
          let crossingCount = 0;
          for (let i = 0; i < len; i++) {
            const r = direction === "across" ? row : row + i;
            const c = direction === "across" ? col + i : col;
            if (grid[r][c].type !== "black") crossingCount++;
          }
          if (placed.length >= 2 && crossingCount === 0) continue;

          // All checks passed — commit to the real grid.
          placeEntry(grid, row, col, direction, cells, clueTypeStr);
          usedClues.add(clueKey);
          placed.push(makeEntry(
            entryId++, row, col, direction, clueTypeStr,
            eq.left, eq.op, eq.right,
          ));
          committed = true;
          break;
        }
      }
    }

    // Only accept a puzzle if it has enough entries AND all white cells form
    // a single connected region (no isolated islands).
    if (placed.length >= minOk && isGridConnected(grid)) {
      numberEntries(grid, placed);
      applyGivens(grid, placed, difficulty, aRng);
      return {
        date: date.toISOString().split("T")[0],
        dayName: difficulty.name,
        seed,
        difficulty,
        grid,
        entries: placed,
        size: SIZE,
      };
    }
  }

  throw new Error("Failed to generate a valid puzzle after many attempts");
}

// Assign clue numbers to entries, crossword-style:
// scan top-to-bottom, left-to-right. Any white cell that starts an
// across or down entry gets a number. Across and down sharing the
// same start cell share the same number.
function numberEntries(grid, entries) {
  // Find all unique starting cells
  const startCells = new Map(); // "r,c" → number

  // Sort entries by start position (top to bottom, left to right)
  entries.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  let num = 1;
  for (const entry of entries) {
    const key = `${entry.row},${entry.col}`;
    if (!startCells.has(key)) {
      startCells.set(key, num++);
    }
    entry.number = startCells.get(key);
  }
}

// Pre-reveal some crossing digit cells as hints on easier days
function applyGivens(grid, entries, difficulty, rng) {
  if (difficulty.givenDigits === 0) return;

  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.crossing && cell.type === "digit") {
        if (rng() < difficulty.givenDigits) {
          cell.given = true;
        }
      }
    }
  }
}


// =============================================================================
// SECTION 7: VALIDATOR
// Given a filled grid, check whether all entries are mathematically correct.
// Returns { valid: bool, errors: [{ entryId, message }] }
// =============================================================================

function validatePuzzle(puzzle, playerGrid) {
  // playerGrid: same dimensions as puzzle.grid
  // each cell: { value: string | null }  (what the player entered)

  const errors = [];

  for (const entry of puzzle.entries) {
    const cells = readEntryCells(playerGrid, entry);

    // Check all cells are filled
    if (cells.some(c => c === null || c === "")) {
      errors.push({ entryId: entry.id, number: entry.number, direction: entry.direction, message: "Incomplete" });
      continue;
    }

    if (entry.clueType === "equation-answer") {
      // Player should have written the numeric answer
      // e.g. clue "4 × 3 − 2", answer should be "10" → cells ["1","0"]
      const expected = buildAnswerCells(entry.result);
      if (!arraysEqual(cells, expected)) {
        errors.push({
          entryId: entry.id,
          number: entry.number,
          direction: entry.direction,
          message: `Expected ${entry.result}, got ${cells.join("")}`,
        });
      }
    } else {
      // make-equation: player wrote an equation, validate it evaluates correctly
      const result = parseAndEvaluateEntry(cells);
      if (result === null) {
        errors.push({
          entryId: entry.id,
          number: entry.number,
          direction: entry.direction,
          message: `Not a valid equation`,
        });
      } else if (result !== entry.result) {
        errors.push({
          entryId: entry.id,
          number: entry.number,
          direction: entry.direction,
          message: `Equation equals ${result}, should equal ${entry.result}`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    total: puzzle.entries.length,
    correct: puzzle.entries.length - errors.length,
  };
}

// Read the player's cell values for a given entry
function readEntryCells(playerGrid, entry) {
  const cells = [];
  for (let i = 0; i < entry.length; i++) {
    const r = entry.direction === "across" ? entry.row : entry.row + i;
    const c = entry.direction === "across" ? entry.col + i : entry.col;
    cells.push(playerGrid[r][c]?.value ?? null);
  }
  return cells;
}

// Parse cells like ["1","2","+","9"] and evaluate: 12 + 9 = 21
// Returns the numeric result, or null if malformed
function parseAndEvaluateEntry(cells) {
  const ops = new Set(["+", "-", "*", "/"]);

  // Find the operator cell
  const opIndex = cells.findIndex(c => ops.has(c));
  if (opIndex === -1) return null; // no operator found
  if (opIndex === 0 || opIndex === cells.length - 1) return null; // op at edge

  const leftStr = cells.slice(0, opIndex).join("");
  const rightStr = cells.slice(opIndex + 1).join("");
  const op = cells[opIndex];

  const left = parseInt(leftStr, 10);
  const right = parseInt(rightStr, 10);

  if (isNaN(left) || isNaN(right)) return null;
  if (leftStr !== String(left)) return null; // leading zeros not allowed
  if (rightStr !== String(right)) return null;

  return evaluate(left, op, right);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}


// =============================================================================
// SECTION 8: CLUE LIST BUILDER
// Returns the across and down clue lists, sorted by number, ready for display.
// =============================================================================

function buildClueLists(puzzle) {
  const across = puzzle.entries
    .filter(e => e.direction === "across")
    .sort((a, b) => a.number - b.number)
    .map(e => ({
      number: e.number,
      clue: e.clue,
      clueType: e.clueType,
      length: e.length,
      entryId: e.id,
    }));

  const down = puzzle.entries
    .filter(e => e.direction === "down")
    .sort((a, b) => a.number - b.number)
    .map(e => ({
      number: e.number,
      clue: e.clue,
      clueType: e.clueType,
      length: e.length,
      entryId: e.id,
    }));

  return { across, down };
}


// =============================================================================
// SECTION 9: PLAYER GRID STATE
// Helpers for managing what the player has typed so far.
// =============================================================================

// Create a blank player grid matching the puzzle grid structure
function createPlayerGrid(puzzle) {
  return puzzle.grid.map(row =>
    row.map(cell => ({
      value: cell.given ? cell.value : null, // pre-fill given hint cells
      given: cell.given,
      locked: cell.given, // given cells can't be changed
    }))
  );
}

// Set a value in the player grid (respects locked cells)
function setPlayerCell(playerGrid, row, col, value) {
  const cell = playerGrid[row][col];
  if (cell.locked) return false;
  cell.value = value;
  return true;
}

// Clear a cell
function clearPlayerCell(playerGrid, row, col) {
  return setPlayerCell(playerGrid, row, col, null);
}

// Get the cells belonging to a specific entry (for highlighting)
function getEntryCells(entry) {
  const cells = [];
  for (let i = 0; i < entry.length; i++) {
    const r = entry.direction === "across" ? entry.row : entry.row + i;
    const c = entry.direction === "across" ? entry.col + i : entry.col;
    cells.push({ row: r, col: c, position: i });
  }
  return cells;
}

// Find which entries a given cell belongs to
function getEntriesForCell(puzzle, row, col) {
  const entries = puzzle.entries ?? puzzle.clues ?? [];
  return entries.filter(entry => {
    for (let i = 0; i < entry.length; i++) {
      const r = entry.direction === "across" ? entry.row : entry.row + i;
      const c = entry.direction === "across" ? entry.col + i : entry.col;
      if (r === row && c === col) return true;
    }
    return false;
  });
}


// =============================================================================
// SECTION 10: SHARE / RESULT SUMMARY
// Generates a shareable text result (Wordle-style), plus stats.
// =============================================================================

function buildShareText(puzzle, playerGrid, solveTimeSeconds) {
  const validation = validatePuzzle(puzzle, playerGrid);
  const date = puzzle.date;
  const day = puzzle.dayName;
  const minutes = Math.floor(solveTimeSeconds / 60);
  const seconds = solveTimeSeconds % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const statusLine = validation.valid
    ? `Solved in ${timeStr}`
    : `${validation.correct}/${validation.total} correct`;

  // Build emoji grid: one emoji per entry
  const emojiRows = buildEmojiGrid(puzzle, playerGrid);

  return [
    `Crossnumbers — ${day} ${date}`,
    statusLine,
    "",
    emojiRows,
    "",
    "crossnumbers.app", // update with your actual URL
  ].join("\n");
}

function buildEmojiGrid(puzzle, playerGrid) {
  const { grid } = puzzle;
  const rows = grid.length;
  const cols = grid[0].length;
  const lines = [];

  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (cell.type === "black") {
        line += "⬛";
      } else {
        const playerVal = playerGrid[r][c]?.value;
        const correct = playerVal === cell.value;
        line += correct ? "🟩" : (playerVal ? "🟥" : "⬜");
      }
    }
    lines.push(line);
  }

  return lines.join("\n");
}


// =============================================================================
// SECTION 11: EXPORTS
// Everything Replit needs to import.
// =============================================================================

// If using ES modules (Replit default for modern JS):
export {
  generatePuzzle,
  validatePuzzle,
  buildClueLists,
  createPlayerGrid,
  setPlayerCell,
  clearPlayerCell,
  getEntryCells,
  getEntriesForCell,
  buildShareText,
  getTodayDifficulty,
  getDayOfWeek,
  DIFFICULTY,
};

// If using CommonJS (Node / older Replit setup), replace the above with:
// module.exports = { generatePuzzle, validatePuzzle, buildClueLists,
//   createPlayerGrid, setPlayerCell, clearPlayerCell, getEntryCells,
//   getEntriesForCell, buildShareText, getTodayDifficulty, getDayOfWeek, DIFFICULTY };
