# Slide 12 — Annual Benefit per Value Driver

## Purpose
Summary slide showing each benefit category's Year 3 (full-run-rate) annual benefit with description and a one-line headline per category.

## Dynamic Fields

### Category 1: DBA Productivity (Shapes 2 + 3)

**Table (Shape 2 — "Table 1", 2 rows x 3 cols)**
| Cell | Current | Dynamic |
|------|---------|---------|
| [1,2] | `$918K` | `dba_yr3` short format |

**Headline (Shape 3 — "TextBox 2")**
- `DBA Productivity & Labor Cost Avoidance annual benefits are estimated at $918K`
- Replace `$918K` with `dba_yr3` short format.

### Category 2: MTTR Reduction (Shapes 4 + 5)

**Table (Shape 4 — "Table 6", 2 rows x 3 cols)**
| Cell | Current | Dynamic |
|------|---------|---------|
| [1,2] | `$600K` | `mttr_yr3` short format |

**Headline (Shape 5 — "TextBox 7")**
- `Faster Incident Resolution (MTTR Reduction) annual benefits are estimated at $600K`
- Replace `$600K` with `mttr_yr3` short format.

### Category 3: SEV-1 Avoidance (Shapes 6 + 7)

**Table (Shape 6 — "Table 8", 2 rows x 3 cols)**
| Cell | Current | Dynamic |
|------|---------|---------|
| [1,2] | `$250K` | `sev1_yr3` short format |

**Headline (Shape 7 — "TextBox 9")**
- `Avoided Severe Incidents & Downtime Risk annual benefits are estimated at $250K`
- Replace `$250K` with `sev1_yr3` short format.

### Category 4: Tool Consolidation (Shapes 8 + 9)

**Table (Shape 8 — "Table 10", 2 rows x 3 cols)**
| Cell | Current | Dynamic |
|------|---------|---------|
| [1,2] | `$100K` | `tool_yr3` short format |

**Headline (Shape 9 — "TextBox 11")**
- `Tool Consolidation & Operational Efficiency annual benefits are estimated at $100K`
- Replace `$100K` with `tool_yr3` short format.

## Inputs
All values are Year 3 annual benefits from the calculation engine.

## Calculations
None — these are Year 3 values already computed in the benefit modules:
```
dba_yr3  = ops_portion × ops_reduction_pct × ramp_yr3
mttr_yr3 = annual_incident_cost × mttr_reduction_pct × ramp_yr3
sev1_yr3 = baseline_sev1_cost × sev1_reduction_pct × ramp_yr3
tool_yr3 = tool_base × ramp_yr3
```

## Formatting Notes
- Table cells [1,2] use short format: `$918K`, `$600K`, `$250K`, `$100K`.
- Headline text is 508000 EMU (40pt), black (#000000).
- Each headline's dollar amount is embedded in the sentence — use string replacement.
- Shape 0 ("Picture 4") is a decorative image — do not modify.
