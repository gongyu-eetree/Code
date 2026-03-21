# FPGA Selection Agent PRD

## Goal
Build a runnable MVP that helps engineers, teachers, students, and product teams choose FPGA devices using application intent, hard constraints, team capability, and business context.

## Primary users
- Embedded and FPGA engineers
- University instructors and students
- Hardware product managers
- R&D sourcing or platform teams

## Core user flows
1. Enter a natural-language project brief and optional structured constraints.
2. Parse request into application profile, resource requirements, interface needs, and team/business context.
3. Filter devices by hard constraints.
4. Rank remaining devices with configurable weighted scoring.
5. Return Top N recommendations, alternatives, risks, toolchain guidance, and board suggestions.

## MVP scope
- Local sample dataset for six vendors.
- Five API-style endpoints for parse, search, rank, recommend, and device lookup.
- Single-page web UI for input, recommendations, comparison, and explanations.
- Built-in demo scenarios and sample queries.

## Non-goals
- Real-time distributor inventory
- LLM-based free-form reasoning over external web data
- User authentication or persistence

## Success criteria
- App starts locally with one command.
- Demo queries return differentiated, explainable recommendations.
- Prototype vs. production stage changes ranking behavior.
- Team skills and toolchain preferences affect results.
