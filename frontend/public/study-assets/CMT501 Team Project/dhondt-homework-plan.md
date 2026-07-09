# D'Hondt Calculator — Homework Plan (Python, local git)

Goal: build a flexible D'Hondt seat allocator in small SPIDR-style increments, one branch per step, each step: **branch → implement → test → merge**. Push later when you move to GitLab.

## D'Hondt refresher

For each seat: divide each party's votes by (seats already won + 1), give the seat to the highest quotient. Repeat until all seats filled.

**Worked example (use as your first test):** votes A=100, B=80, C=30, D=20; 6 seats.
Quotients taken in order: 100(A), 80(B), 50(A), 40(B), 33.3(A), 30(C) → **A=3, B=2, C=1, D=0**.

## Setup (on `main`)

```
mkdir dhondt && cd dhondt && git init
python -m venv .venv && pip install pytest
```

Layout: `dhondt/` package + `tests/` folder, plus `.gitignore` and a one-paragraph README. Commit this skeleton to `main`.

## Increment 1 — branch `01-single-constituency`

*SPIDR: Data (one constituency) + Rules (fixed 6 seats, ignore ties) + Interface (parties only).*

- `allocate(votes: dict[str, int]) -> dict[str, int]` — hardcode 6 seats.
- Tests: the worked example above; landslide (one party takes all 6); two equal-ish parties; empty/zero-vote edge cases.
- Merge to main when green.

## Increment 2 — branch `02-variable-seats`

*SPIDR: Rules (unfreeze the constant).*

- Add `seats: int = 6` parameter.
- Tests: same votes with seats=1 (only A wins), seats=2 (A,B), seats=10; seats=0; invalid (negative) raises ValueError.

## Increment 3 — branch `03-candidate-lists`

*SPIDR: Interface/Data (richer output: elected members, not just counts).*

- Input gains per-party ordered candidate lists; output the elected names in election order.
- Tests: worked example → A's top 3, B's top 2, C's top 1 elected; party wins more seats than it has candidates (decide the rule, test it).

## Increment 4 — branch `04-multiple-constituencies`

*SPIDR: Data (scale to the full country).*

- `allocate_all(constituencies)` — each constituency has its own votes, candidates, seat count (Wales: 16 × 6).
- Tests: two small constituencies with known results; national seat totals sum correctly.

## Increment 5 — branch `05-thresholds`

*SPIDR: Rules (add the rule you relaxed).*

- Optional `threshold: float = 0.0` — parties below X% of constituency votes are excluded before allocation.
- Tests: party just below vs. just at the threshold; threshold=0 matches old results (regression).

## Increment 6 (stretch) — branch `06-ties`

*The rule you were told to ignore — now handle it explicitly.*

- Define tie-breaking (e.g., most total votes, then alphabetical) and test it with exactly-equal quotients.

## Per-increment routine (the actual homework)

1. `git switch -c <branch>` from main
2. Write the test first if you want TDD practice, or implement then test
3. `pytest` green → `git switch main && git merge <branch>`
4. Later: push all branches + main to GitLab so the history shows the increments

## Tips

- Keep quotient comparison in integers where possible: compare `votes_a * (won_b + 1)` vs `votes_b * (won_a + 1)` instead of floats — avoids precision bugs and makes a nice talking point.
- Real-world check: Senedd 2026 used exactly this system (16 constituencies × 6 seats), so real results exist to validate against.
- Merge with `--no-ff` if you want the branch structure visible in `git log --graph` — nice for showing the professor.
