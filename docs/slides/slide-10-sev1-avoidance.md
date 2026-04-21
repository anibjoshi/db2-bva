# Slide 10 — Avoided Severe Incidents & Downtime Risk (Appendix Detail)

## Purpose
Detailed breakdown of the SEV-1 incident avoidance benefit calculation.

## Dynamic Fields

### Headline Benefit (Shape 2 — Freeform "Freeform 15")
- `$712K` → `sev1_total` short format (3-year total)

### Calculation Table (Shape 5 — "Table 8", 7 rows x 5 cols)

| Row | Col 0 | Col 1 (Label) | Col 2 | Col 3 | Col 4 | Formula |
|-----|-------|---------------|-------|-------|-------|---------|
| 0 | A | # of high-severity SEV-1 incidents, per year | `sev1_per_year` | | | Input |
| 1 | B | Average cost per SEV-1 in financial services | `cost_per_sev1` | | | Input |
| 2 | C | Reduction in SEV-1 occurrence | `sev1_reduction_pct` | | | Input |
| 3 | D | Baseline SEV-1 cost | `baseline_sev1_cost` | | | `A × B` |
| 4 | | | `Year 1` | `Year 2` | `Year 3` | Headers |
| 5 | E | Benefit Realization | `ramp_yr1` | `ramp_yr2` | `ramp_yr3` | Input |
| 6 | | Annual Benefit | `sev1_yr1` | `sev1_yr2` | `sev1_yr3` | `D × C × E` |

## Inputs

| Variable | Source |
|----------|--------|
| `sev1_per_year` | User input (Slide 5, Row 11) |
| `cost_per_sev1` | User input (Slide 5, Row 12) |
| `sev1_reduction_pct` | User input (Slide 5, Row 13) |
| `ramp_yr1/2/3` | User input (Slide 5, Row 1) |

## Calculations

```
baseline_sev1_cost = sev1_per_year × cost_per_sev1
  Example: 2 × $250,000 = $500,000

sev1_yr1 = baseline_sev1_cost × sev1_reduction_pct × ramp_yr1
  Example: $500,000 × 0.50 × 0.90 = $225,000

sev1_yr2 = baseline_sev1_cost × sev1_reduction_pct × ramp_yr2
  Example: $500,000 × 0.50 × 0.95 = $237,500

sev1_yr3 = baseline_sev1_cost × sev1_reduction_pct × ramp_yr3
  Example: $500,000 × 0.50 × 1.00 = $250,000

sev1_total = sev1_yr1 + sev1_yr2 + sev1_yr3
  Example: $225,000 + $237,500 + $250,000 = $712,500
```

## Formatting Notes
- Headline `$712K` at 96pt. Short format.
- Same table formatting as Slides 8–9.
