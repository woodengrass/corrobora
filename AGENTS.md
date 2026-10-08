# AGENTS.md

## Project and authority

Corrobora studies diagnostic experience transfer across complete Minecraft technical farms.
The long-term loop is requirements -> design -> build -> execute -> measure -> diagnose -> revise.
Start with repair_restricted. Evaluate free_optimize and design_build separately; repairing a
supplied farm does not establish autonomous design. Do not use the ambiguous repair_optimize
mode for new tasks.

Read README.md and docs/README.md, then docs/plan/00-overview.md and 06-roadmap.md.
Document ownership:
- 02-system-and-stack.md: deployment, adapters, module boundaries.
- agent-world-interface.md: model-visible world semantics, observation and timing.
- agent-tool-contracts.md: argument/result types, examples, pagination and tool manual.
- agent-world-acceptance.md: pending W01-W22 and G01-G08 acceptance requirements.
- 03-farm-testbed.md: legal farm tasks, modes, accounting and final evaluation.
- 04-experience-method.md: frozen reuse plans, validators and deterministic gate decisions.
- 05-evaluation-protocol.md: baselines, I0-I2, selection comparisons and research controls.
- 07-data-and-safety.md: source rights, immutable evidence and disclosure boundaries.

Only the current specification is authoritative. Update dependent documents together, do not
recreate old memory-first plans or archive copies. Git preserves history.

Current state is planning/P0: no runnable Corrobora application, server adapter, farm runner
or experiment results. Proposed APIs, example JSON and acceptance IDs are not implemented tests.
raw-data/ and benchmark/gold_dataset/ are source/reference assets, not the new farm benchmark.

## Workflow and implementation

Inspect current files and Git state before editing; preserve concurrent user changes.
Keep planning prose in Traditional Chinese and code/comments/docstrings in English.
Build a measurable reference farm and independent evaluator before model experiments.
Register every candidate and exclusion in docs/experiments/candidate-registry.md.
Use p0-first-farm.md and p1-interface-smoke.md for actual evidence, not invented results.

Proposed stack: typed Python control/analysis, version-pinned Java/Fabric adapter, JSONL
immutable evidence and SQLite metadata. Confirm game/JDK/loader/API compatibility by build
and integration tests. No pyproject, Gradle project or launch commands exist yet; only actual
project configuration establishes executable commands.

Reject unknown fields and enforce dimensions, half-open bounds, registry/state validation,
world ownership, budget and numeric limits. Models use the runner, never unrestricted RCON,
OP or host access. The Java server thread must not block waiting on its own control jobs.
Long operations return tracked jobs with actual partial progress and cancellation semantics.

Reads must not implicitly load chunks or advance simulation. Missing data is not zero or air.
Pagination belongs to one immutable observation capture. state_token, design_revision and
sim_tick are distinct; stale writes fail rather than silently targeting a different state.
Idempotency tracks request identity, not every future invocation of identical arguments.

Use step_controlled only after testing player and loading exceptions. Do not assume vanilla
tick freeze is a complete world snapshot. Cold reset is acceptable; do not promise perfect RNG
rollback. Sensors and renderers exist only if implemented, advertised and validated.

Separate deterministic validation/accounting from LLM calls. Use small typed functions,
explicit dependencies and errors; do not share hidden global state across runs. Slow external
calls stay outside storage transactions. No new databases, graphs, distributed orchestration,
training or arbitrary self-modification without observed need and controlled comparison.

## Model understanding and experimental integrity

The bootstrap contains only public task details, actual tool capabilities and a non-semantic
world overview. Do not mount researcher documents, hidden fault metadata or gold module graphs
as a model manual. Models propose revisable region annotations grounded in real observations.
Use identical isolated tool tutorials across arms; no formal task answers in onboarding.

Separate append-only evidence, revisioned experience and mutable working state. Record prior
predictions or explicit unknowns before experiments, never reconstruct them after observation.
Citation existence, executable code, accurate predictions and causal support are different.

CDET is an untested candidate, not a mandatory novel algorithm. Models propose preconditions;
a deterministic controller checks only supported validator contracts. It cannot establish that
preconditions are complete. Unknown, partial, stale and tool failures must not become supported.
No agent-controlled global verified flag. General investigation remains possible; do not claim
the gate prevents all implicit reuse. Failed plans and fallback costs are retained.

Keep B1 raw history, B2 ordinary notes and B3 fixed workflow strong. I0/I1/I2 separate prompts,
extra evidence and enforcement; S1 experiment ranking is a separate treatment. Match model,
manual/schema, sensors, data precision, sources, operating modes and budgets. Baselines can
reason, check applicability and write bounded analysis tools. Count acquisition, maintenance,
failed trials, initialization, edits, simulation and human assistance.

Common-history and autonomous-history experiments have different causal interpretations.
Split by lineage/mechanism combinations, not coordinate changes. Keep simple cases and all
candidate exclusions; difficult subsets do not represent all farms. Legal rebuilding is not
cheating in free_optimize, but does not by itself establish diagnosis.

Preserve failures, timeouts, invalid designs and uncertain explanations. Keep public development
feedback separate from held-out labels and scores, including researcher-driven test tuning.
Actual success and cost matter, not only rule adherence. Do not claim global priority, RSI,
model-proof necessity, acceptance or science-fair outcomes from plans or demonstrations.

## Safety and sources

Enforce permissions in code. No host credentials, evaluator files, private labels, other arms'
histories, arbitrary filesystem reads or unrestricted network. Loopback alone is not security.
Generated tools never replace trusted observations or scoring. Diagnostic worlds cannot return
injected items or changed rules to scored worlds; final designs run in clean evaluation worlds.

Preserve original source bytes and licenses. Public repository visibility is not permission to
redistribute or send data to a model provider. Follow 07-data-and-safety.md; do not publish game
source, license-pending material, private IDs, secrets or hidden answers. Do not invent authors
or grant licenses. Ask before external deployment, purchases, wider disclosure, credentials or
execution of unreviewed dependencies; these are not side effects of a documentation task.

## Verification and Git

Check exact diffs, changed paths, relative links, examples and readback. Distinguish manual
review from executed checks. Do not claim runtime or acceptance tests ran for documentation
changes. Once code exists, add appropriate unit, contract and integration tests; benchmark
runs are separate evidence. Update status only with actual commands, versions and result paths.

Use scoped docs:, feat:, fix: or test: commits. Never force-push or rewrite history. Documentation
cleanup can remove obsolete plans when authorized, but must not alter raw data, original
fixtures or research evidence as a side effect.
