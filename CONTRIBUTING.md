# Contributing to SentinelX SIEM

We love your input! We want to make contributing to SentinelX as easy and transparent as possible.

## Development Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Code Standards

### Python
- **Formatter**: `ruff format`
- **Linter**: `ruff check`
- **Types**: `mypy` — all public functions must have type annotations
- **Tests**: `pytest` with `pytest-asyncio`

### TypeScript
- **Linter**: ESLint with Next.js config
- **Types**: Strict TypeScript — no `any` in new code

## Branch Strategy

```
main          — production releases
develop       — integration branch
feature/*     — new features
fix/*         — bug fixes
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `git commit -m "feat: add alert deduplication"`
4. Push and open a PR against `develop`
5. Ensure CI passes (lint + tests)
6. Request review from a maintainer

## Adding a New Log Parser

1. Create `backend/services/parser-service/parsers/your_source.py`
2. Implement the `BaseParser` interface:
   ```python
   class YourSourceParser(BaseParser):
       def can_parse(self, raw: dict) -> bool: ...
       def parse(self, raw: dict) -> NormalizedEvent: ...
   ```
3. Register in `backend/services/parser-service/parser_chain.py`
4. Add unit tests in `backend/tests/parsers/test_your_source.py`

## Adding a Detection Rule Type

1. Add rule evaluator in `backend/services/detection-service/rules/`
2. Add Pydantic schema in `backend/shared/models/rules.py`
3. Add migration if schema changes: `database/supabase/migrations/000X_rule_type.sql`

## Security Reporting

Do **not** open public issues for security vulnerabilities. Email `security@sentinelx.io` with details.
