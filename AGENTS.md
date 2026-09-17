# AGENTS.md

## Project Overview

Domain Research Infrastructure / Agentic Research Memory. First domain: Minecraft Technical.
Planning-phase repo: no runnable `src/`, no PG/Qdrant running yet. Truth is `docs/plan/`,
current-state is `docs/plan/10-current-state-and-migrations.md`.
Read order `00-overview-and-architecture.md -> 10 -> 08-scope-and-mvp.md -> 09-roadmap-and-benchmark.md`.
`docs/legacy-reference/`, `raw-data/`, `benchmark/gold_dataset/` are inputs, not specs.
Current tree: `docs/plan/`, `docs/legacy-reference/`, `raw-data/`, `benchmark/gold_dataset/`;
future runtime `src/corrobora/` does not exist yet — do not invent it as done.

## Commands

No `pyproject`, FastAPI app, compose, or Alembic chain exists yet. Do not invent
`pytest / uvicorn / alembic upgrade` as passing. Currently only: `python -m json.tool`
for tracked JSON sanity, `git status`, docs link checks. When runtime lands,
single source is `pyproject.toml`: `uv run ruff check`, `uv run ruff format --check`,
`uv run pyright`, `uv run pytest`.

## Code Style

- Ruff is source of truth: four spaces, double-quoted strings, 100-char line length,
  absolute imports, deterministic ordering. Config lives in `pyproject.toml`; do not hand-format.
- Use `snake_case` for modules, functions, variables, and Python model fields; `PascalCase` for
  classes; `UPPER_SNAKE_CASE` for constants. DB tables/columns are `snake_case` per
  `docs/plan/01-postgres-schema.md`.
- New Python and new JSON contracts use `snake_case`. Pydantic aliases only to preserve an
  existing external contract. Tracked legacy JSON in `raw-data/`, `benchmark/` is immutable —
  translate at the adapter boundary, never rename source fixtures to fake consistency.
- Annotate public boundaries and return types. Prefer built-in generics and `X | None` on
  Python 3.12; no unbounded `Any`, unchecked casts, or untyped `dict` without a `# reason:`
  comment at the use site. `pyright` strictness follows `pyproject.toml`.
- Pydantic `extra="forbid"` at API, tool, config, and import boundaries. SQLAlchemy ORM models
  are not Pydantic models — validate with Pydantic schemas at the edge, persist with ORM
  inside. Internal value objects use frozen dataclasses; no `dict | list[dict]` as a system
  contract.

```python
from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1)
    version_scope_id: int | None = None


@dataclass(frozen=True, slots=True)
class RankedFinding:
    finding_revision_id: int
    validation_id: int
    score: float
```

- Raise specific domain exceptions (`src/corrobora/**/errors.py` when runtime lands). Translate
  to stable `error_code` at API/tool boundary only; never expose raw DB/driver exceptions.
- Use stdlib logging with `extra={}` structured context, not f-strings. Never log tokens,
  credentials, private source content, or complete user payloads. Raw retention and event
  retention are separate per `docs/plan/07-evidence-and-verification.md`.
- Code, comments, docstrings in English (docs in `docs/` stay Traditional Chinese). Google-style
  docstrings on public APIs and non-obvious behavior; comments explain why, not what.

## Architecture Rules

- Stack: Python 3.12, FastAPI, Pydantic, PostgreSQL + Alembic, Qdrant, Ruff (100-char),
  Pyright. Future shape is single modular monolith `src/corrobora/` (`api/ research/ memory/
  corpus/ retrieval/ code/ machines/ storage/ jobs/`) + bounded worker, not microservices.
- PG is authoritative for findings, status, versions, permissions. Qdrant holds
  `raw_passages` / `research_findings` candidates only and must stay rebuildable from PG.
  Always hydrate status/scope/ACL from PG; Qdrant payload never decides truth. On stale or
  unavailable index, degrade via PG lexical and record `retrieval_incomplete`.
- Short PG transactions; slow LLM calls and embeddings run outside transactions. Small typed
  functions with explicit dependencies; no hidden global singletons. External tools and
  `POST /v1/ask` share the same application services.
- Do not add Kafka, Neo4j, ColBERT/multi-vector everywhere, JDT/SCIP/CodeQL, CFG/DFG,
  vLLM/SGLang, or domain LLM training without a benchmark win. Ports (`DenseEncoder`,
  `VectorRetriever`, etc.) stay swappable; BGE-M3 is baseline, not fixed.
- No DB to migrate yet. `docs/legacy-reference/migrations/0001-0004` are SQLite references,
  not executable on PG. Future batches follow `docs/plan/08-scope-and-mvp.md:44-53` and
  P1-P10 in `10-current-state-and-migrations.md`; raw bytes + revisions append-only with
  dual hash (`raw_content_hash` + `normalized_content_hash`), never overwrite originals.

## Boundaries

### Always Do

- Distinguish observed state vs proposed design vs untested hypothesis; link to
  `docs/plan/` instead of claiming done.
- Keep deterministic validation, state transitions, and version handling separate from LLM
  calls; save research sessions/events with locators/hashes, not full copied texts.
- Prefer pure-function unit tests for validation, scope, and permission checks; synthetic
  fixtures only, no network/`.env`/production DB. `benchmark/` is evaluation, not unit tests.

### Ask First

- Expanding corpus sources, adding a second code snapshot, changing encoder/reranker,
  introducing any optional stack above, or reusing `provisional` beyond research hints.
- Turning `TechMC Glossary` (`internal`, license pending) or `minecraft source code/`
  (`DO NOT REDISTRIBUTE`) into public output.

### Never Do

- Self-mark `verified`, overwrite `verified` content, delete sources, edit provenance, or
  lower `verified` bar for automation. `trust_level` is license traceability, not factual
  accuracy. Research agents propose `provisional`; only reviewers/workers per
  `docs/plan/05-agent-design.md` and `07-evidence-and-verification.md` change validity.
- Modify `raw-data/`, `benchmark/gold_dataset/`, `docs/legacy-reference/` to fit new code;
  do not claim 81 machine rows imply `.litematic` bytes exist (count is 0), or 33 questions
  have `expected_source_ids` (all empty), or 9 machine baselines were replayed here.
- Batch-import external Claims as `verified`; missing scope/dependencies enter as
  `provisional` with ID mapping preserved.

## Git, Commits, and Pull Requests

Use `docs:`, `docs(plan-xx):`, `feat:`, `fix:` per existing `git log`; small focused commits,
no force-push, no secrets in history.
