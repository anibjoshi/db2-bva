# Slide 3 — Business Case Summary

## Purpose
Financial dashboard slide with KPI callout boxes, a summary table (benefits / investment / net benefit), a narrative sentence, and a summary chart image.

## Dynamic Fields

### KPI Callout Boxes

| Shape | Name | Current Value | Dynamic Field | Calculation |
|-------|------|--------------|---------------|-------------|
| 0 | `Google Shape;207;p25` | `$5.32M` | `total_3yr_benefits` (short format) | Sum of all benefits |
| 3 | `Google Shape;207;p25` | `0.0%` + `ROI` | `roi_pct` | `(total_3yr_benefits - total_investment) / total_investment * 100` |
| 4 | `Google Shape;207;p25` | `$367K` + `3-Month Cost of Delay` | `cost_of_delay_3mo` | `npv / (3 years * 4 quarters)` |
| 5 | `Google Shape;207;p25` | `Immediate` + `Payback Period` | `payback_period` | If investment is 0 or benefits exceed year-1 investment → "Immediate" |
| 6 | `Google Shape;492;p74` | `$4.4M` + `Net Present Value` | `npv` (short format) | NPV of net benefits at discount rate |

### Summary Table (Shape 9 — "Table 7", 4 rows x 5 cols)

| Row | Label | Year 1 | Year 2 | Year 3 | 3-Year Total |
|-----|-------|--------|--------|--------|--------------|
| 1 | Benefits | `benefit_yr1` | `benefit_yr2` | `benefit_yr3` | `total_3yr_benefits` |
| 2 | Investment | `invest_yr1` | `invest_yr2` | `invest_yr3` | `total_investment` |
| 3 | **Net Benefit** | `net_yr1` | `net_yr2` | `net_yr3` | `net_total` |

Currently investment is `---` (zero/not specified). When investment is provided, these cells should show dollar amounts.

### Narrative Sentence (Shape 10)
Template: `The 3-year total benefits are estimated at {total_3yr_benefits_short} with net benefits of {net_total_short} and a 3-year ROI of {roi_pct}.`

Runs breakdown:
| Run | Text | Dynamic |
|-----|------|---------|
| 0 | `The 3-year total benefits are estimated at ` | No |
| 1 | `$5.32M ` | Yes — `total_3yr_benefits` short format |
| 2 | `with net benefits of ` | No |
| 3 | `$5.32M ` | Yes — `net_total` short format |
| 4 | `and a ` | No |
| 5 | `3-year ROI of 0.0%` | Yes — `roi_pct` |
| 6 | `.` | No |

### Summary Chart Image (Shape 8 — "summary_chart")
PNG image (30KB). This is a **generated bar/waterfall chart** showing benefits vs investment vs net. Must be **regenerated** and replaced.

## Inputs

| Input | Type | Notes |
|-------|------|-------|
| `total_investment` | number | Optional. If 0, investment row shows `---` |
| `invest_yr1`, `invest_yr2`, `invest_yr3` | number | Yearly investment breakdown |
| `discount_rate` | percentage | For NPV calculation (default 10%) |

All benefit values flow from the calculation engine.

## Calculations

```
net_yr1 = benefit_yr1 - invest_yr1
net_yr2 = benefit_yr2 - invest_yr2
net_yr3 = benefit_yr3 - invest_yr3
net_total = net_yr1 + net_yr2 + net_yr3

total_investment = invest_yr1 + invest_yr2 + invest_yr3

roi_pct = (total_3yr_benefits - total_investment) / total_investment * 100
  → If total_investment == 0: display "0.0%" (or "N/A")

npv = Σ (net_yr_t / (1 + discount_rate)^t) for t = 1..3

cost_of_delay_3mo = npv / (3 * 4)  # NPV spread over 12 quarters

payback_period:
  → If invest_yr1 == 0 or benefit_yr1 >= invest_yr1: "Immediate"
  → Otherwise calculate cumulative net benefit quarter by quarter
```

## Formatting Notes
- KPI values use large font (108pt for total, smaller for others). Short currency format: `$5.32M`, `$367K`.
- Net Benefit row in table is **bold**.
- Narrative Run 1 and Run 3 are bold (total benefits and net benefits).
