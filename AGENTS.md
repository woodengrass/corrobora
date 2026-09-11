# AGENTS.md

## Project Overview

## Technology Stack

- Runtime and API: Python 3.12, FastAPI, and Pydantic.
- Authoritative storage: PostgreSQL, with Alembic for schema migrations.
- Candidate and vector index: Qdrant. It must remain rebuildable from PostgreSQL.
- Formatting and linting: Ruff, using a 100-character line length.
- Static type checking: Pyright.

## Build and Test Commands

## Code Style

- Use four spaces, double-quoted strings, a 100-character line length, absolute imports, and
  deterministic import ordering.
- Use `snake_case` for modules, functions, variables, and Python model fields; `PascalCase` for
  classes; and `UPPER_SNAKE_CASE` for constants.
- Keep Python and new JSON contracts in `snake_case`. Use Pydantic aliases only when preserving an
  existing external contract that uses another naming convention.
- Annotate public boundaries and return types. Prefer built-in generics and `X | None`; do not use
  unbounded `Any`, unchecked casts, or untyped dictionaries without a documented reason.
- Use validated models with forbidden extra fields at API, tool, configuration, and persistence
  boundaries. Use standard dataclasses for simple internal value objects.

```python
from dataclasses import dataclass

from pydantic import BaseModel, ConfigDict, Field


class SearchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1)
    game_version_id: int


@dataclass(frozen=True, slots=True)
class RankedCandidate:
    claim_id: int
    score: float
```

- Raise specific domain exceptions in domain and infrastructure code. Translate them into stable
  API or tool errors only at the relevant boundary; do not expose raw backend exceptions.
- Use parameterized logging with structured context, not f-strings. Never log tokens, credentials,
  private source content, or complete user payloads.

```python
logger.info(
    "Evidence retrieval completed",
    extra={"claim_id": claim_id, "candidate_count": len(candidates)},
)
```

- Write identifiers, comments, and docstrings in English. Add docstrings to public APIs and
  non-obvious behavior; comments explain why a constraint exists, not what a line does.
- Keep deterministic validation, state transitions, and version handling separate from LLM calls.
  Prefer small typed functions and explicit dependencies over hidden global state.

## Testing

## Security

## Git, Commits, and Pull Requests

## Boundaries

### Always Do

### Ask First

### Never Do

## Project Structure Map

## Architecture Rules

## Protected Files

## Database Migration Rules

## Completion Report
