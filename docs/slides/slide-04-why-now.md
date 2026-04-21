# Slide 4 — Why Now? (Cost of Doing Nothing)

## Purpose
Persuasion slide showing the quarterly cost of inaction. Features a visual cash-stream comparison and a large callout of the per-quarter forfeited value.

## Dynamic Fields

| Shape | Name | Current Value | Dynamic Field |
|-------|------|--------------|---------------|
| 10 | `Content Placeholder 3`, Run 1 | `<Customer>` | `customer_name` |
| 10 | `Content Placeholder 3`, Para 1 Run 0 | `$367K ` (large text) | `cost_of_delay_3mo` (short format) |

### Full text structure of Shape 10 (Content Placeholder 3):
- Para 0: `With every quarter of inaction, ` + `<Customer>` + ` forfeits `
  - Run 0: `With every quarter of inaction, ` (355600 size, bold=False)
  - Run 1: `<Customer>` (355600 size, bold=None — inherits)
  - Run 2: ` forfeits ` (355600 size, bold=False)
- Para 1: `$367K ` (2235200 size = 176pt — very large callout)
- Para 2: `in business benefits based on the net present value of IBM platform.` (355600 size)

## Inputs
All values come from the calculation engine:

| Input | Source |
|-------|--------|
| `customer_name` | User input |
| `cost_of_delay_3mo` | `npv / 12` (see Slide 3 calculations) |

## Calculations
```
cost_of_delay_3mo = npv / (3 * 4)
```
Formatted as short currency: `$367K`, `$1.2M`, etc.

## Static Elements (do not modify)
- Shape 1: "The cost of doing nothing" header
- Shape 3: "Projected cash stream from investing in IBM" label
- Shape 4: "Assumed cash stream resulting from doing nothing" label
- Shape 5: Harvard Business Review citation
- Shape 8: Freeform decorative shape (the visual cash stream curves)
- Shape 9: Calculation explanation note
- Shape 11: "Why Now?" title
- Shapes 6, 7: Arrow connectors

## Formatting Notes
- The `$367K` value in Para 1 is rendered at **176pt** — the largest text on the slide. Preserve this size.
- `<Customer>` in Para 0 inherits surrounding formatting.
