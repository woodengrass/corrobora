# AGENTS.md

## Project Overview and Planning Authority

Corrobora studies cross-farm diagnostic experience transfer and continual autonomous
engineering in Minecraft Technical. The intended loop is requirements -> design -> build
-> execute -> measure -> diagnose -> revise. Start with complete-farm repair/optimization;
from-requirements design is a separate later acceptance stage, not a removed objective.

Planning-phase repo: no runnable Corrobora application, farm runner, or reported experiment
results exist yet. Do not infer implementation from proposed APIs, schemas, or diagrams.
Read `docs/plan/README.md`, then 00 -> 08 -> 15 -> 16 -> 09 -> 12.

The 2026-10-01 versions of 00/08/09/12/13/15/16/17 define the current research plan.
Plans 01-07/10/11/14 and `docs/research/` remain supporting or historical references;
they do not mandate the old Documents+Memory-first roadmap. In particular, the migration
sequence in 10 is historical, not the current P0-P5 milestones. Keep provenance, licensing,
immutable evidence, and verification boundaries even when simplifying infrastructure.

`docs/legacy-reference/`, `raw-data/`, and `benchmark/gold_dataset/` are existing inputs,
not the new farm benchmark. Historical inventory counts are not a fresh audit.

## Commands

No pyproject, application, compose stack, or Alembic chain exists yet. Do not claim
pytest, uvicorn, or database migrations passed. For documentation-only changes, check
links, changed paths, and Git diffs; distinguish manual review from executed checks.
When runtime lands, its actual project configuration is the source of truth for lint,
type checking, tests, and launch commands. Do not invent passing commands.

## Code Style

- New runtime is proposed in Python, with a version-pinned Minecraft server adapter.
  Use the language required by the selected server integration; do not invent APIs.
- Prefer typed small functions, explicit dependencies, snake_case Python/JSON fields,
  PascalCase classes, and UPPER_SNAKE_CASE constants. Do not rename tracked legacy
  fixture fields to fake consistency; adapt at the import boundary.
- Proposed Python conventions: four spaces, double quotes, 100-character lines,
  deterministic ordering, absolute imports. Configure Ruff/Pyright before treating
  their rules as enforced. Actual project configuration wins.
- Annotate public boundaries and return types. Prefer built-in generics and `X | None`.
  Avoid unbounded Any, unchecked casts, or untyped system contracts.
- Validate tool/config/import boundaries with explicit schemas; reject unknown fields.
  Pydantic models are not database ORM models. Use immutable value objects where useful.
- Raise specific domain errors and translate them to stable tool error codes. Do not
  expose raw database errors, credentials, or host details to an agent.
- Use structured logging, avoid secrets and unnecessary full source copies in logs.
  Raw experimental evidence and source retention follow separate policies.
- Code, comments, and docstrings in English; planning prose in Traditional Chinese.

## Architecture Rules

- Build the executable testbed and strong baselines first. CDET is an untested candidate,
  not an assumed winning method. Generic memory, reflection, tool creation, and RSI
  are not automatically novel contributions.
- Pilot can use typed Python contracts, immutable artifact files, and SQLite/JSONL
  metadata. FastAPI, PostgreSQL, Qdrant, complete corpus ingestion, and large knowledge
  graphs are optional supporting infrastructure, not prerequisites for P0-P2.
- If PostgreSQL/Qdrant are introduced, PG owns authoritative records, scopes, permissions,
  and validation states. Qdrant provides rebuildable candidates only; hydrate authority
  from PG and record degraded retrieval. Slow model calls stay outside transactions.
- Prefer a small modular runtime with replaceable model/harness/environment adapters.
  Do not add distributed services, Kafka, Neo4j, full CodeQL/SCIP pipelines, domain model
  training, or arbitrary self-modification without a measured need.
- Separate immutable raw evidence, revisioned persistent experience, and task-local
  working state. Agent-generated scripts or narratives never replace trusted observations.
- Proposed module paths are not existing files. Database schema documents are not
  executable migrations; old SQLite reference migrations are not a deployed database.

## Experiment Boundaries

### Always Do

- Distinguish observed repository state, proposed design, hypotheses, and measured results.
- Preserve source bytes/revisions and artifact hashes. Record pre-intervention predictions
  before observing outcomes; never reconstruct them after a result and call them prior.
- Keep simulator, diagnostic forks, final evaluator, and private evaluation metadata
  isolated. Enforce budgets, allowed areas, actions, and filesystem/network permissions
  in code, not only in prompts. No unrestricted host/server-op access for agents.
- Exclude injected diagnostic items and initial inventories from legitimate farm output.
  Run final validation on a clean world; do not trust an agent-authored scorer.
- Match raw evidence access, tools, model version, and budgets across relevant baselines.
  Baselines may reason, inspect applicability, search raw history, and write bounded tools.
  Count memory construction, maintenance, failures, and human assistance.
- Treat timeout, zero production, invalid designs, and unsupported explanations as data.
  Do not discard failed runs to reduce reported cost. Keep held-out feedback out of
  agent memory and method tuning; use separate development data.
- Preserve version/scope uncertainty. A source change triggers revalidation, not an
  automatic assertion that its dependent claims are false.
- Use synthetic fixtures for unit tests. Benchmark runs are separate from unit tests;
  do not use private data, .env files, or production databases in tests.

### Ask First

- Expanding corpus licenses/public disclosure, adding copyrighted game source snapshots,
  or redistributing third-party blueprints beyond verified permissions.
- Publishing TechMC Glossary (internal/license pending) or the ignored Minecraft source.
- Deploying to an external server, making purchases, opening unrestricted network access,
  installing unreviewed executable dependencies, or using private credentials.
- Turning provisional evidence into an automatically approved fact, or changing the
  independent evaluator after formal evaluation has started.

### Never Do

- Self-mark claims globally verified, overwrite approved evidence, delete sources, or
  edit provenance. Agents propose provisional revisions; reviewers/trusted workers
  validate only the stated scope. Citation existence, execution success, prediction
  accuracy, and causal support are different checks.
- Modify raw-data/, benchmark/gold_dataset/, or docs/legacy-reference/ to fit new code.
  Historical machine catalog rows do not establish possession of .litematic bytes;
  old QA fixtures are not complete-farm gold or executed benchmark results.
- Redistribute ignored game source, license-pending data, secrets, or hidden test answers.
- Claim global priority, demonstrated RSI, model-proof necessity, conference acceptance,
  or a science-fair outcome from this planning document.

## Git, Commits, and Pull Requests

Use docs:, docs(plan-xx):, feat:, or fix: prefixes. Keep changes scoped and reviewable.
Read current files before replacing them. Preserve concurrent user changes; no force-push.
Do not change existing raw data, benchmark fixtures, runtime code, or workflows as a
side effect of a planning-document request.
