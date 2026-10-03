# AGENTS.md

## Project and authority

Corrobora studies diagnostic experience transfer across complete Minecraft technical farms.
The long-term loop is requirements -> design -> build -> execute -> measure -> diagnose
-> revise. Start with complete-farm repair/optimization; evaluate from-requirements design
separately. A repaired supplied farm does not establish autonomous design.

Read README.md, docs/README.md, then docs/plan/00-overview.md and
06-roadmap.md. docs/plan/02-system-and-stack.md, 03-farm-testbed.md and
04-experience-method.md own implementation contracts; 05-evaluation-protocol.md owns
experimental controls; 07-data-and-safety.md owns source and security restrictions.

Only the current docs tree is authoritative. Do not recreate obsolete memory-first plans,
legacy implementation references or archive copies. Git history preserves old work.

Current state: planning/P0. No runnable Corrobora application, server adapter, farm runner,
or reported results exist. Proposed modules and APIs are not completed implementation.
raw-data/ and benchmark/gold_dataset/ are source/reference assets, not farm benchmark gold.

## Workflow

- Inspect current files and Git state before editing. Preserve concurrent user changes.
- Build a measurable reference farm and reliable evaluator before agent experiments.
- Run strong baselines before implementing CDET. It is an untested candidate, not a
  mandatory architecture or a proven original algorithm.
- Keep one current specification for each contract and update all dependent links.
- Prefer small, typed components and replaceable model/environment interfaces.
- Planning prose is Traditional Chinese; code, comments and docstrings are English.
- Do not claim tests, builds, link checks or experiments ran unless actually executed.

## Proposed implementation

Python control/analysis, a version-pinned Java/Fabric adapter, immutable artifact files,
JSONL events and SQLite metadata are sufficient starting points. Confirm game/JDK/loader
compatibility before locking versions. Current documentation examples may target a
newer game version and must not be copied as compatible APIs without verification.

No pyproject, Gradle project or runnable test commands exist yet. Add actual configuration
before documenting installation or launch commands. Once present, project configuration
is the source of truth for format, lint, typing, tests and build commands.

Use explicit schemas at tool/config boundaries, reject unknown fields, and enforce numeric,
path and area limits. Prefer small functions, explicit dependencies and typed errors.
Separate deterministic validation/accounting from model calls. No hidden global state
shared between experiments. Record cancellations and partial failures rather than retrying
silently. Slow external calls must not hold storage transactions.

Do not introduce PostgreSQL, vector databases, knowledge graphs, distributed services,
full-corpus ingestion, model training or arbitrary harness self-modification without an
observed need and an appropriate controlled comparison.

## Experimental integrity

- Separate append-only raw evidence, revisioned experience and mutable task-local state.
- Commit testable predictions before observations; never fabricate them retrospectively.
- Citation existence, code execution, prediction accuracy and causal support are different.
  No agent-controlled global verified flag.
- Match model, general harness, tools, source access and budgets across comparisons.
  Baselines may reason, inspect applicability, search raw history and write bounded tools.
- Count acquisition, memory creation, maintenance, failures, tests and human assistance.
- Separate common-history experiments from end-to-end autonomous experience streams.
- Split by design lineage/mechanism combinations, not trivial coordinate changes.
- Preserve timeouts, invalid designs, zero output, uncertain diagnoses and negative results.
- Keep public development feedback distinct from hidden final evaluation. Do not train
  memory or tune methods on final scores, including through researcher inspection.
- Repair success does not prove a unique cause. Allow unidentifiable alternatives.
- Do not claim global priority, demonstrated RSI, model-proof necessity, acceptance or
  science-fair outcomes from planning or anecdotal demonstrations.

## Safety and source boundaries

Enforce world areas, materials, permissions, tool budgets and cancellation in code.
Agents do not receive unrestricted server OP, host shell, evaluator files, private labels,
other arms' histories or credentials. Use isolated diagnostic forks and clean final worlds.
Exclude initial output inventory, injected items and forged counters from valid production.
Generated tools never replace trusted raw observation or final scoring.

Preserve original source bytes and licenses. Public repository visibility is not evidence
of redistribution permission or permission to send data to external model services.
Follow docs/plan/07-data-and-safety.md; game source and license-pending corpus require
explicit review. Do not invent source authors, grant new licenses or publish private IDs.

Ask before deploying external servers, purchasing services, broadening data disclosure,
using private credentials or executing unreviewed upstream dependencies. Do not perform
these as side effects of a documentation task.

## Verification and Git

For documentation changes inspect the exact diff, changed paths, relative links and
readback. State which checks are manual versus executed. Do not claim runtime tests for
a planning-only repository. For code, add unit/contract/integration tests appropriate to
actual functionality; benchmark runs are separate evidence.

Use scoped commits with docs:, feat:, fix: or test: prefixes. Never force-push or rewrite
history to clean documents. Explicit document cleanup may remove obsolete plans and
unused legacy references, but not raw research evidence or fixtures as a side effect.
