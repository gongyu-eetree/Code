# Data Model

## Core entities
- `FPGADevice`: normalized device metadata and capabilities.
- `BoardRecommendation`: development board candidate tied to a device or family.
- `ApplicationProfile`: scenario template with default weights and preferred/avoided traits.
- `SelectionRequest`: end-user request containing natural language, structured constraints, team profile, and business context.
- `ParsedConstraints`: normalized filters and inferred scenario/application signals.
- `ScoreBreakdown`: weighted component scores plus notes.
- `SelectionResult`: ranked device recommendation with explanations and alternatives.

## Modeling principles
- Keep numeric resources normalized in consistent units.
- Represent hard IP features explicitly (`pcie_support`, `ddr_support`, `mipi_support`, `hard_cpu`).
- Keep supply, lifecycle, cost, and ecosystem data alongside technical features so business trade-offs can be scored.
- Store `recommended_for` and `not_recommended_for` tags for application-aware reasoning.
