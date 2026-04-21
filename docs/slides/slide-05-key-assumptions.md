# Slide 5 — Key Assumptions

## Purpose
Lists all input assumptions that drive the BVA calculations. This is the **primary input slide** — most user-provided values live here.

## Dynamic Fields

### Assumptions Table (Shape 4 — "Table 1", 14 rows x 2 cols)

| Row | Assumption (Col 0) | Value (Col 1) | Input Variable | Type |
|-----|-------------------|---------------|----------------|------|
| 0 | Header: `Key Assumption` / `Value` | — | Static | — |
| 1 | Benefit Realization ramp (Years 1-3) | `90%, 95%, 100%` | `ramp_yr1`, `ramp_yr2`, `ramp_yr3` | percentages |
| 2 | # of DBAs supporting enterprise workloads | `20` | `num_dbas` | integer |
| 3 | "All-in" DBA annual pay | `$180,000` | `dba_annual_pay` | currency |
| 4 | % of DBA time spent on operations | `85%` | `dba_ops_pct` | percentage |
| 5 | Reduction in manual operational effort driven by Db2 Genius Hub | `30%` | `ops_reduction_pct` | percentage |
| 6 | Material Db2 performance or availability incidents, per year | `40` | `incidents_per_year` | integer |
| 7 | Average business impact, per material Db2 incident | `$50,000` | `cost_per_incident` | currency |
| 8 | Reduction in time to resolution | `30%` | `mttr_reduction_pct` | percentage |
| 9 | # of tools supporting Db2 today | `4` | `num_tools` | integer |
| 10 | Reducible overhead cost, per tool | `$25,000` | `cost_per_tool` | currency |
| 11 | # of high-severity SEV-1 Db2 incidents, per year | `2` | `sev1_per_year` | integer |
| 12 | Average cost per SEV-1 in financial services industry | `$250,000` | `cost_per_sev1` | currency |
| 13 | Reduction in SEV-1 occurrence | `50%` | `sev1_reduction_pct` | percentage |

## Inputs — Complete User Input List

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ramp_yr1` | % | 90% | Year 1 benefit realization |
| `ramp_yr2` | % | 95% | Year 2 benefit realization |
| `ramp_yr3` | % | 100% | Year 3 benefit realization |
| `num_dbas` | int | 20 | Number of DBAs |
| `dba_annual_pay` | $ | 180,000 | Fully-loaded DBA annual cost |
| `dba_ops_pct` | % | 85% | % of DBA time on operations |
| `ops_reduction_pct` | % | 30% | Operational effort reduction from Genius Hub |
| `incidents_per_year` | int | 40 | Material incidents per year |
| `cost_per_incident` | $ | 50,000 | Business impact per incident |
| `mttr_reduction_pct` | % | 30% | MTTR reduction |
| `num_tools` | int | 4 | Current Db2 monitoring tools |
| `cost_per_tool` | $ | 25,000 | Reducible overhead per tool |
| `sev1_per_year` | int | 2 | High-severity incidents per year |
| `cost_per_sev1` | $ | 250,000 | Cost per SEV-1 incident |
| `sev1_reduction_pct` | % | 50% | Reduction in SEV-1 occurrence |

## Calculations
None on this slide — it's purely input display. But these values drive all calculations on slides 2, 3, 6, 8–12.

## Formatting Notes
- Table cell values in Col 1 should be formatted consistently: `$180,000` for currency, `85%` for percentages, plain integers for counts.
- Row 1 value is a comma-separated string: `90%, 95%, 100%`.
- Shape 2 is a decorative image (WMF format) — do not modify.
