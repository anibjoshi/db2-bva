# Slide 6 — Executive Summary

## Purpose
One-page executive summary with KPI boxes, value proposition narrative, strategic objectives, solutions list, and a horizontal bar chart of top benefits.

## Dynamic Fields

### KPI Boxes

| Shape | Label | Current Value | Dynamic Field |
|-------|-------|--------------|---------------|
| 5 | 3-Year Benefits | `$5.32M` | `total_3yr_benefits` (short) |
| 6 | Payback Period | `Immediate` | `payback_period` |
| 7 | Net Present Value | `$4.4M` | `npv` (short) |
| 11 | Return on Investment | `0.0%` | `roi_pct` |

### Narrative Text (Shape 1 — "Google Shape;288;p43")
Template: `Enabling Customer to deliver on its vision with potential to realize {total_3yr_benefits_short} over 3 years.`

| Run | Text | Dynamic |
|-----|------|---------|
| 0 | `Enabling Customer to deliver on its vision with potential to realize ` | Yes — replace `Customer` with `customer_name` |
| 1 | `$5.32M ` | Yes — `total_3yr_benefits` short format |
| 2 | `over ` | No |
| 3 | `3 years` | No |
| 4 | `.` | No |

### Value Proposition Box (Shape 0)
| Para | Text | Dynamic |
|------|------|---------|
| 1 | `From our collaborative assessment, <Customer> can realize the following value:` | Yes — replace `<Customer>` with `customer_name` |

### Solutions Box (Shape 2)
Contains 3 references to `<Customer>`:
`This report, developed by IBM in collaboration with <Customer>, leverages information provided by <Customer>, publicly available information, and industry standards to summarize the approximate quantified business impact offered to <Customer> by the following solution(s):`

All three `<Customer>` → `customer_name`

### Bar Chart (Shape 16 > Sub 0 — "top_benefits_chart_std")
Embedded CHART object (BAR_CLUSTERED). Data:
| Category | Value |
|----------|-------|
| DBA Productivity & Labor Cost Avoidance | `dba_total` |
| Faster Incident Resolution (MTTR Reduction) | `mttr_total` |
| Avoided Severe Incidents & Downtime Risk | `sev1_total` |
| Tool Consolidation & Operational Efficiency | `tool_total` |

This is a live chart object — update via `chart.replace_data()`.

## Inputs
All values from calculation engine + `customer_name`.

## Calculations
Same as Slide 3 (KPIs) + benefit totals from slides 8–11.

## Formatting Notes
- KPI box values are at 812800 EMU (64pt). Short format: `$5.32M`, `$4.4M`.
- KPI labels are 304800 EMU (24pt) below the value.
- Narrative bold on Run 1 (`$5.32M`).
- The bar chart is an actual PowerPoint chart object, not an image — can update data programmatically.

## Static Elements
- Shape 3: "Strategic Objectives" header
- Shape 4: Solution list (Db2 AI Editions, Genius Hub)
- Shape 8, 9, 15: Decorative lines
- Shape 13: Strategic objectives bullet text
- Shape 14: "Key Benefits and Estimated Impact" header
