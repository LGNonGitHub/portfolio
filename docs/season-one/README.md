# Season One — saved design state

Paused at the owner's request (weekly usage at 98%). Nothing here is live; `main` is untouched.

- `plan.json` — the director's full build plan: concept, cuts, 8 work packages with exact specs, file ownership, shared-file edits and acceptance checks. Wave 1: foundation, prologue, episode-openers, print-plates, work-grimoire. Wave 2: season-body, finale, mana-stage.
- `proposals-and-scores.json` — all 39 proposals and the three judges' scores (`tally` is the correct ranking).
- `prototypes/` — the raw-WebGL2 mana-stage prototype (open `mana-stage.html` in a browser), its renders, the KanjiVG stroke data and the episode-opener prototype.
- `wip/` — uncommitted, unverified partial work from the foundation and prologue builders when they were stopped. Reference only.

To resume: build wave 1 from `plan.json`, one isolated worktree per package, then merge, then wave 2.
