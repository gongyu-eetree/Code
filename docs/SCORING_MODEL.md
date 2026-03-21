# Scoring Model

## Dimensions and default weights
- ApplicationFit: 0.30
- ResourceFit: 0.20
- InterfaceFit: 0.15
- ToolchainFit: 0.10
- BoardFeasibility: 0.10
- CostFit: 0.05
- SupplyLifecycleFit: 0.05
- CommunityFit: 0.05

## Rule adjustments
- Education lowers emphasis on high-end/high-speed devices and boosts board feasibility/cost.
- Prototype raises board feasibility and tool maturity.
- Production raises lifecycle, availability, and long-term supply weighting.
- Low-experience teams get penalties for devices requiring DDR/SerDes-heavy board work.
- Linux/SoC use cases boost hard CPU support.
- Vision bridge use cases boost MIPI support, power efficiency, and compact packages.

## Explanation policy
Every result explains:
- why it matched the scenario
- major advantages
- key risks
- why it outranks the second-place result
- cheaper and production-oriented alternatives
