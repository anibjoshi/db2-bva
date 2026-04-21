# Slide 9 — Faster Incident Resolution / MTTR Reduction (Appendix Detail)

## Purpose
Detailed breakdown of the MTTR Reduction benefit calculation.

## Dynamic Fields

### Headline Benefit (Shape 2 — Freeform "Freeform 15")
- `$1.71M` → `mttr_total` short format (3-year total)

### Calculation Table (Shape 5 — "Table 8", 7 rows x 5 cols)

| Row | Col 0 | Col 1 (Label) | Col 2 | Col 3 | Col 4 | Formula |
|-----|-------|---------------|-------|-------|-------|---------|
| 0 | A | Material Db2 incidents, per year | `incidents_per_year` | | | Input |
| 1 | B | Average business impact, per incident | `cost_per_incident` | | | Input |
| 2 | C | Reduction in time to resolution | `mttr_reduction_pct` | | | Input |
| 3 | D | Annual incident cost | `annual_incident_cost` | | | `A × B` |
| 4 | | | `Year 1` | `Year 2` | `Year 3` | Headers |
| 5 | E | Benefit Realization | `ramp_yr1` | `ramp_yr2` | `ramp_yr3` | Input |
| 6 | | Annual Benefit | `mttr_yr1` | `mttr_yr2` | `mttr_yr3` | `D × C × E` |

## Inputs

| Variable | Source |
|----------|--------|
| `incidents_per_year` | User input (Slide 5, Row 6) |
| `cost_per_incident` | User input (Slide 5, Row 7) |
| `mttr_reduction_pct` | User input (Slide 5, Row 8) |
| `ramp_yr1/2/3` | User input (Slide 5, Row 1) |

## Calculations

```
annual_incident_cost = incidents_per_year × cost_per_incident
  Example: 40 × $50,000 = $2,000,000

mttr_yr1 = annual_incident_cost × mttr_reduction_pct × ramp_yr1
  Example: $2,000,000 × 0.30 × 0.90 = $540,000

mttr_yr2 = annual_incident_cost × mttr_reduction_pct × ramp_yr2
  Example: $2,000,000 × 0.30 × 0.95 = $570,000

mttr_yr3 = annual_incident_cost × mttr_reduction_pct × ramp_yr3
  Example: $2,000,000 × 0.30 × 1.00 = $600,000

mttr_total = mttr_yr1 + mttr_yr2 + mttr_yr3
  Example: $540,000 + $570,000 + $600,000 = $1,710,000
```

## Formatting Notes
- Headline `$1.71M` at 96pt. Short format.
- Same table formatting as Slide 8.
