# Master Reference — Inputs, Calculations & Output Map

## Complete User Input List

### Customer Info
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `customer_name` | string | `Customer` | 1, 2, 4, 6 |
| `report_date` | string | auto (e.g. `April 2026`) | 1 |

### Investment (optional)
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `invest_yr1` | currency | 0 | 3 |
| `invest_yr2` | currency | 0 | 3 |
| `invest_yr3` | currency | 0 | 3 |
| `discount_rate` | percentage | 10% | 3 |

### Benefit Realization Ramp
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `ramp_yr1` | percentage | 90% | 5, 8, 9, 10, 11 |
| `ramp_yr2` | percentage | 95% | 5, 8, 9, 10, 11 |
| `ramp_yr3` | percentage | 100% | 5, 8, 9, 10, 11 |

### DBA Productivity Inputs
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `num_dbas` | integer | 20 | 5, 8 |
| `dba_annual_pay` | currency | $180,000 | 5, 8 |
| `dba_ops_pct` | percentage | 85% | 5, 8 |
| `ops_reduction_pct` | percentage | 30% | 5, 8 |

### MTTR Reduction Inputs
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `incidents_per_year` | integer | 40 | 5, 9 |
| `cost_per_incident` | currency | $50,000 | 5, 9 |
| `mttr_reduction_pct` | percentage | 30% | 5, 9 |

### SEV-1 Avoidance Inputs
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `sev1_per_year` | integer | 2 | 5, 10 |
| `cost_per_sev1` | currency | $250,000 | 5, 10 |
| `sev1_reduction_pct` | percentage | 50% | 5, 10 |

### Tool Consolidation Inputs
| Variable | Type | Default | Used On Slides |
|----------|------|---------|----------------|
| `num_tools` | integer | 4 | 5, 11 |
| `cost_per_tool` | currency | $25,000 | 5, 11 |

---

## Complete Calculation Chain

### Step 1: Benefit Category Calculations

**DBA Productivity** (Slide 8)
```
total_dba_labor = num_dbas × dba_annual_pay
ops_portion     = total_dba_labor × dba_ops_pct
dba_yr1         = ops_portion × ops_reduction_pct × ramp_yr1
dba_yr2         = ops_portion × ops_reduction_pct × ramp_yr2
dba_yr3         = ops_portion × ops_reduction_pct × ramp_yr3
dba_total       = dba_yr1 + dba_yr2 + dba_yr3
```

**MTTR Reduction** (Slide 9)
```
annual_incident_cost = incidents_per_year × cost_per_incident
mttr_yr1             = annual_incident_cost × mttr_reduction_pct × ramp_yr1
mttr_yr2             = annual_incident_cost × mttr_reduction_pct × ramp_yr2
mttr_yr3             = annual_incident_cost × mttr_reduction_pct × ramp_yr3
mttr_total           = mttr_yr1 + mttr_yr2 + mttr_yr3
```

**SEV-1 Avoidance** (Slide 10)
```
baseline_sev1_cost = sev1_per_year × cost_per_sev1
sev1_yr1           = baseline_sev1_cost × sev1_reduction_pct × ramp_yr1
sev1_yr2           = baseline_sev1_cost × sev1_reduction_pct × ramp_yr2
sev1_yr3           = baseline_sev1_cost × sev1_reduction_pct × ramp_yr3
sev1_total         = sev1_yr1 + sev1_yr2 + sev1_yr3
```

**Tool Consolidation** (Slide 11)
```
tool_base  = num_tools × cost_per_tool
tool_yr1   = tool_base × ramp_yr1
tool_yr2   = tool_base × ramp_yr2
tool_yr3   = tool_base × ramp_yr3
tool_total = tool_yr1 + tool_yr2 + tool_yr3
```

### Step 2: Aggregate Benefits (Slides 2, 3)
```
benefit_yr1        = sev1_yr1 + dba_yr1 + mttr_yr1 + tool_yr1
benefit_yr2        = sev1_yr2 + dba_yr2 + mttr_yr2 + tool_yr2
benefit_yr3        = sev1_yr3 + dba_yr3 + mttr_yr3 + tool_yr3
total_3yr_benefits = benefit_yr1 + benefit_yr2 + benefit_yr3
```

### Step 3: Net Benefits & Financial KPIs (Slide 3)
```
total_investment = invest_yr1 + invest_yr2 + invest_yr3

net_yr1   = benefit_yr1 - invest_yr1
net_yr2   = benefit_yr2 - invest_yr2
net_yr3   = benefit_yr3 - invest_yr3
net_total = net_yr1 + net_yr2 + net_yr3

roi_pct = (total_3yr_benefits - total_investment) / total_investment × 100
  → If total_investment == 0: "0.0%"

npv = net_yr1/(1+r)^1 + net_yr2/(1+r)^2 + net_yr3/(1+r)^3
  where r = discount_rate (default 0.10)

cost_of_delay_3mo = npv / 12

payback_period:
  → If total_investment == 0 or benefit_yr1 >= invest_yr1: "Immediate"
  → Otherwise: calculate quarter-by-quarter cumulative
```

---

## Slide-by-Slide Output Map

| Slide | What Gets Updated | Source |
|-------|-------------------|--------|
| 1 — Title | `customer_name`, `report_date` | Inputs |
| 2 — Benefits Overview | Full 4×4 benefit table + totals row, title headline, taxonomy_chart (image) | Step 1 + 2 |
| 3 — Business Case Summary | 5 KPI boxes, summary table (3 rows), narrative sentence, summary_chart (image) | Step 2 + 3 |
| 4 — Why Now? | `customer_name`, `cost_of_delay_3mo` | Step 3 |
| 5 — Key Assumptions | All 13 assumption values | Inputs (direct) |
| 6 — Executive Summary | 4 KPI boxes, narrative, `customer_name` (×4), bar chart data | Step 2 + 3 |
| 7 — Appendix Divider | Nothing | — |
| 8 — DBA Productivity | Headline total, 9-row calc table | Step 1 (DBA) |
| 9 — MTTR Reduction | Headline total, 7-row calc table | Step 1 (MTTR) |
| 10 — SEV-1 Avoidance | Headline total, 7-row calc table | Step 1 (SEV-1) |
| 11 — Tool Consolidation | Headline total, 5-row calc table | Step 1 (Tool) |
| 12 — Annual Benefit/Driver | 4 tables + 4 headlines (Year 3 values) | Step 1 (yr3 values) |
| 13 — Case for Change | Nothing | — |
| 14 — Closing | Nothing | — |

---

## Generated Assets (Charts/Images to Regenerate)

| Slide | Shape Name | Type | What It Shows |
|-------|-----------|------|---------------|
| 2 | `taxonomy_chart` | PNG image | Benefit breakdown visualization — must regenerate with matplotlib/plotly and replace |
| 3 | `summary_chart` | PNG image | Benefits vs Investment vs Net Benefit — must regenerate and replace |
| 6 | `top_benefits_chart_std` | Embedded PPTX Chart (BAR_CLUSTERED) | Horizontal bar chart of 4 benefit totals — update via `chart.replace_data()` |

---

## Currency Formatting Reference

| Context | Format | Example |
|---------|--------|---------|
| Table cells (full) | `$X,XXX,XXX` | `$2,616,300` |
| Headlines / KPI boxes | Short form | `$2.62M`, `$712K`, `$367K` |
| Title callout | Short form | `$5.32M` |
| Percentages | `X.X%` or `X%` | `85%`, `0.0%` |

**Short form rules:**
- >= $1,000,000: `$X.XXM` (drop trailing zeros: `$10M` not `$10.00M`)
- >= $1,000: `$XXXK` (round to nearest K)
- < $1,000: `$XXX`
