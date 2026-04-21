# Slide 11 — Tool Consolidation & Operational Efficiency (Appendix Detail)

## Purpose
Detailed breakdown of the tool consolidation benefit calculation.

## Dynamic Fields

### Headline Benefit (Shape 2 — Freeform "Freeform 15")
- `$285K` → `tool_total` short format (3-year total)

### Calculation Table (Shape 5 — "Table 8", 5 rows x 5 cols)

| Row | Col 0 | Col 1 (Label) | Col 2 | Col 3 | Col 4 | Formula |
|-----|-------|---------------|-------|-------|-------|---------|
| 0 | A | # of tools supporting Db2 today | `num_tools` | | | Input |
| 1 | B | Reducible overhead cost, per tool | `cost_per_tool` | | | Input |
| 2 | | | `Year 1` | `Year 2` | `Year 3` | Headers |
| 3 | C | Benefit Realization | `ramp_yr1` | `ramp_yr2` | `ramp_yr3` | Input |
| 4 | | Annual Benefit | `tool_yr1` | `tool_yr2` | `tool_yr3` | `A × B × C` |

**Note:** This is the simplest calculation — no intermediate "baseline" row. The annual base is just `num_tools × cost_per_tool`.

## Inputs

| Variable | Source |
|----------|--------|
| `num_tools` | User input (Slide 5, Row 9) |
| `cost_per_tool` | User input (Slide 5, Row 10) |
| `ramp_yr1/2/3` | User input (Slide 5, Row 1) |

## Calculations

```
tool_base = num_tools × cost_per_tool
  Example: 4 × $25,000 = $100,000

tool_yr1 = tool_base × ramp_yr1
  Example: $100,000 × 0.90 = $90,000

tool_yr2 = tool_base × ramp_yr2
  Example: $100,000 × 0.95 = $95,000

tool_yr3 = tool_base × ramp_yr3
  Example: $100,000 × 1.00 = $100,000

tool_total = tool_yr1 + tool_yr2 + tool_yr3
  Example: $90,000 + $95,000 + $100,000 = $285,000
```

## Formatting Notes
- Headline `$285K` at 96pt. Short format.
- Same table formatting as Slides 8–10.
