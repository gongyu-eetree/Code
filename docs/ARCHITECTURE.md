# Architecture

## Runtime shape
This MVP uses a lightweight Node HTTP server to expose JSON APIs and render a responsive web UI. The codebase keeps a Next.js-style directory layout (`app`, `components`, `lib`, `types`, `docs`) so it can be migrated to Next.js when package installation is available.

## Layers
- `lib/data`: local FPGA dataset, application templates, board metadata
- `lib/parser`: natural-language parsing and request normalization
- `lib/rules`: expert rule adjustments and stage/team heuristics
- `lib/scoring`: filtering, weighted scoring, explanation generation
- `app/api`: endpoint handlers mapped by the Node server
- `components`: HTML component renderers for UI sections
- `app`: page assembly and client-side orchestration

## Request pipeline
1. Client submits `SelectionRequest`
2. Parser derives `ParsedConstraints` and scenario signals
3. Filter removes devices that fail hard constraints
4. Rules adjust scoring weights and penalties
5. Scoring engine computes per-dimension scores
6. Explanation engine builds reasons, risks, alternatives, and board guidance
7. Response returns ranked `SelectionResult[]`

## Migration path
The domain, scoring, and API handler modules are framework-agnostic. They can move into Next.js route handlers and React components with minimal changes.
