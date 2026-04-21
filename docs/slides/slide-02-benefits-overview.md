# Slide 2 — Benefits Overview Table

## Purpose
High-level summary table showing 4 benefit categories across 3 years with a grand total. Title headline calls out the total savings.

## Dynamic Fields

### Title (Shape 0 — "Title 1")
| Run | Current Text | Dynamic? |
|-----|-------------|----------|
| 0 | `Genius Hub empowers <Customer> to save ` | Yes — replace `<Customer>` with `customer_name` |
| 1 | `$10M` (bold) | Yes — `total_3yr_benefits` formatted as short currency (e.g. `$5.32M`) |
| 2 | ` over three years` | No |

### Benefits Table (Shape 1 — "Table 1", 6 rows x 5 cols)

| Row | Col 0 (Label) | Col 1 (Year 1) | Col 2 (Year 2) | Col 3 (Year 3) | Col 4 (3-Year Total) |
|-----|--------------|----------------|----------------|----------------|---------------------|
| 0 | Headers (static) | | | | |
| 1 | Avoided Severe Incidents & Downtime Risk | `sev1_yr1` | `sev1_yr2` | `sev1_yr3` | `sev1_total` |
| 2 | DBA Productivity & Labor Cost Avoidance | `dba_yr1` | `dba_yr2` | `dba_yr3` | `dba_total` |
| 3 | Faster Incident Resolution (MTTR Reduction) | `mttr_yr1` | `mttr_yr2` | `mttr_yr3` | `mttr_total` |
| 4 | Tool Consolidation & Operational Efficiency | `tool_yr1` | `tool_yr2` | `tool_yr3` | `tool_total` |
| 5 | **Benefit** (total row) | `benefit_yr1` | `benefit_yr2` | `benefit_yr3` | `total_3yr_benefits` |

### Images
- **Shape 2** — "Picture 16": Static IBM logo/decoration. Do not modify.
- **Shape 4** — "taxonomy_chart": PNG image (32KB). This is a **generated chart** showing the taxonomy/breakdown of benefits. Must be **regenerated** from the calculated data and replaced.

## Inputs (from calculation engine)
All monetary values flow from the 4 benefit category calculations (see slides 8–11).

## Calculations

```
benefit_yr1 = sev1_yr1 + dba_yr1 + mttr_yr1 + tool_yr1
benefit_yr2 = sev1_yr2 + dba_yr2 + mttr_yr2 + tool_yr2
benefit_yr3 = sev1_yr3 + dba_yr3 + mttr_yr3 + tool_yr3
total_3yr_benefits = benefit_yr1 + benefit_yr2 + benefit_yr3
```

## Formatting Notes
- Title Run 1 (total) is **bold**. Preserve.
- All currency cells formatted as `$X,XXX` or `$X,XXX,XXX`.
- Title total formatted as short form: `$5.32M`, `$10M`, etc.
