# Slide 8 — DBA Productivity & Labor Cost Avoidance (Appendix Detail)

## Purpose
Detailed breakdown of the DBA Productivity benefit calculation with a step-by-step formula table.

## Dynamic Fields

### Headline Benefit (Shape 2 — Freeform "Freeform 15")
- `$2.62M` → `dba_total` short format (3-year total)

### Calculation Table (Shape 5 — "Table 8", 9 rows x 5 cols)

| Row | Col 0 | Col 1 (Label) | Col 2 | Col 3 | Col 4 | Formula |
|-----|-------|---------------|-------|-------|-------|---------|
| 0 | A | Db2 DBAs supporting enterprise workloads | `num_dbas` | | | Input |
| 1 | B | "All-in" DBA annual pay | `dba_annual_pay` | | | Input |
| 2 | C | % of DBA time spent on operations | `dba_ops_pct` | | | Input |
| 3 | D | Reduction in manual operational effort | `ops_reduction_pct` | | | Input |
| 4 | E | Total DBA labor cost | `total_dba_labor` | | | `A × B` |
| 5 | F | Operational portion | `ops_portion` | | | `E × C` |
| 6 | | | `Year 1` | `Year 2` | `Year 3` | Headers |
| 7 | G | Benefit Realization | `ramp_yr1` | `ramp_yr2` | `ramp_yr3` | Input |
| 8 | | Annual Benefit | `dba_yr1` | `dba_yr2` | `dba_yr3` | `F × D × G` |

## Inputs

| Variable | Source |
|----------|--------|
| `num_dbas` | User input (Slide 5, Row 2) |
| `dba_annual_pay` | User input (Slide 5, Row 3) |
| `dba_ops_pct` | User input (Slide 5, Row 4) |
| `ops_reduction_pct` | User input (Slide 5, Row 5) |
| `ramp_yr1/2/3` | User input (Slide 5, Row 1) |

## Calculations

```
total_dba_labor = num_dbas × dba_annual_pay
  Example: 20 × $180,000 = $3,600,000

ops_portion = total_dba_labor × dba_ops_pct
  Example: $3,600,000 × 0.85 = $3,060,000

dba_yr1 = ops_portion × ops_reduction_pct × ramp_yr1
  Example: $3,060,000 × 0.30 × 0.90 = $826,200

dba_yr2 = ops_portion × ops_reduction_pct × ramp_yr2
  Example: $3,060,000 × 0.30 × 0.95 = $872,100

dba_yr3 = ops_portion × ops_reduction_pct × ramp_yr3
  Example: $3,060,000 × 0.30 × 1.00 = $918,000

dba_total = dba_yr1 + dba_yr2 + dba_yr3
  Example: $826,200 + $872,100 + $918,000 = $2,616,300
```

## Formatting Notes
- Headline `$2.62M` is at 96pt (1219200 EMU). Use short format.
- Table inputs formatted as: integers plain, currency `$180,000`, percentages `85%`.
- Calculated cells formatted as `$X,XXX,XXX`.
- "3-year total benefit" label (Shape 1) is static.
