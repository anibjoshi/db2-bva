# Slide 1 — Title Slide

## Purpose
Cover slide for the Business Value Assessment deck.

## Dynamic Fields

| Field | Current Value | Shape / Location | Input Required |
|-------|--------------|-------------------|----------------|
| Customer Name | `Customer` | Shape 0 "Title", Para 0, Run 0 | Yes — `customer_name` |
| Subtitle line 1 | `Business Value Assessment` | Shape 0, Para 0, Run 1 | No (static) |
| Product line 1 | `Db2 AI Editions` | Shape 0, Para 0, Run 2 | No (static) |
| Product line 2 | `Genius Hub` | Shape 0, Para 0, Run 3 | No (static) |
| Date | `April 2026` | Shape 0, Para 0, Run 4 | Yes — `report_date` (auto-generated from current date) |

## Inputs

| Input | Type | Example |
|-------|------|---------|
| `customer_name` | string | `Acme Corp` |
| `report_date` | string | `April 2026` (auto-format from generation date) |

## Calculations
None — direct text substitution only.

## Notes
- Run 0 (`Customer`) is bold, size 93.98pt. Preserve bold + size.
- Run 4 (`April 2026`) has explicit color `#000000`. Preserve.
- Shape 1 is a decorative background group — do not modify.
