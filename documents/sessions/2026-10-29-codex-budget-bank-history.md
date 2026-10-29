# 2026-10-29 · Codex · Budget · bank history and independent monthly allowances

## Goal

Reconcile the supplied Lloyds history with existing Budget entries, preserve detailed receipts and stock, and follow the user's subsequent directions on cashback, pending transport, plain transaction names and monthly allowances.

## What I did

- Reviewed every supplied screenshot, cross-checked OCR and balance arithmetic, collapsed screenshot overlaps, and matched existing receipt totals across purchase/posting dates. Obtained the user's confirmations for shared spending and estimated entries.
- Reconciled through the owning revision-checked API. Superseded estimates are retained in the private audit; itemised receipts, existing notes, linked repayments, inventory, use, meals and subscriptions remain intact.
- Added standalone income/cashback with editable date, amount and allowance inclusion. The displayed monthly allowance and allowance editor include incoming funds once; spending totals remain separate.
- Applied the user's independent-month rule: overspending stays visible in each month's history and does not reduce another month's allowance. Historical months use the stated monthly limit. Added a compact monthly totals table.
- Removed the repeated explanatory banner, forecast paragraphs and carry-forward text from Home/Money. The main summary shows allowance, spent and remaining/over budget. New entries have normal merchant names; screenshot filenames and import explanations were removed from active app data. Original evidence remains in the private run folder.
- Recorded the pending transport payment once at the user's explicit request, retaining a hidden pending identity for matching when it settles. Its recorded-on date is distinguished from the unknown bank posting date.

## Files and commits

Checkpoint: `[budget-bank-cp1] Reconcile bank history and show independent monthly budgets` on `stage/4b-one-look`. Budget source/build, income domain/UI tests, and the day adapter/header are included. No push. Personal bank data and evidence remain ignored.

## How I checked it

- Budget: `node --test tests/*.test.cjs` — 193 pass, including independent-month arithmetic, income edit/remove/roundtrip, active Home/Money rendering, allowance editor and isolated persistence/backups.
- Host: `node --test hosting/home/shopping.test.mjs hosting/day/service.test.mjs hosting/calendar/*.test.mjs` — 39 pass. No reseeding app tests run.
- `node budget-management/app/build.cjs` and `git diff --check` pass. Safe launcher restart succeeded; APIs and final state were read back.
- Live browser: imported transactions, editable cashback, simplified Home/Money, monthly totals and the next month's full allowance. Read-only navigation; no test transactions saved.

## Data touched

Budget API revisions 110 → 116. Each save produced an automatic snapshot under `budget-management/data/backups/`; complete before/after copies, source hashes, ledger, checks, reconciliation scripts and screenshots are in `.runtime/lloyds-reconciliation-2026-10-29/`. The final snapshot is `final.json`; `monthly-totals.json` records the resulting month figures. No Wise/Revolut import or external bank action was performed.

## Problems and surprises

- The first storage/source-adapter tests could not open loopback sockets inside the sandbox; rerunning with local socket access passed.
- The active Money screen wraps the older implementation. Initial checks exposed this; the final active renderer now has its own regression test.
- Screenshot rows use bank posting dates. Existing verified receipt purchase dates remain authoritative; source posting dates are retained separately.
- The source is outgoing-filter screenshots, with intentionally redacted rows. Those rows and missing incoming/refund history were not invented. Merchant-only purchases remain uncategorised where item content is unknown. Existing payments not evidenced here remain for later cross-account reconciliation.

## Small decisions I made, and questions for Xar

Used the repeatedly confirmed cashback amount; applied the same monthly limit to historical imported months in response to “every month”. The pending fare is dated by the date recorded because the image provides no posting date. No required question remains.

## Next step

Review Budget → Money & saving → Monthly totals. When Wise/Revolut evidence arrives, reconcile against the existing source identities and preserved unmatched entries, including the pending fare and user-reported cashback. Keep transaction names plain.
