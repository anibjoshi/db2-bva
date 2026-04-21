# BVA Deck Generator — Implementation Plan

## Context

We need a web app that lets users input customer-specific values and generates a customized PowerPoint Business Value Assessment deck (14 slides). The frontend matches the existing `zora-customer-survey` app's stack and patterns.

The `zora-customer-survey` app uses:
- **React 18 + TypeScript + Vite** (NOT Next.js)
- **IBM Carbon Design System** (`@carbon/react` v1.50.0, dark theme g90)
- **React Router DOM** for multi-page flows
- **Plain fetch** API client (no axios/react-query)
- **useState** for form state (no form libraries)
- **Express.js** backend with CORS

We'll mirror this stack for the frontend and use **Python (FastAPI)** for the backend since PPTX generation requires `python-pptx`.

---

## Architecture

```
db2-genius-hub-bva/
├── Db2GeniusHub_BVA.pptx              # Template (read-only)
├── docs/slides/                        # Already exists
├── backend/                            # Python / FastAPI
│   ├── main.py                         # FastAPI app, CORS, POST /api/generate
│   ├── models.py                       # Pydantic request model + calculations dataclass
│   ├── calculator.py                   # Pure functions: inputs → all computed values
│   ├── formatting.py                   # Currency/percentage formatting helpers
│   ├── pptx_generator.py              # Orchestrator: opens template, calls updaters, returns bytes
│   ├── slide_updaters.py              # Per-slide text/table update functions
│   ├── chart_builder.py              # Chart creation (slides 2,3) and update (slide 6)
│   └── requirements.txt
├── frontend/                           # React + Vite + Carbon (matches zora-customer-survey)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx                    # Entry point
│   │   ├── App.tsx                     # Root with Carbon theme + header
│   │   ├── App.css                     # Carbon overrides
│   │   ├── index.css                   # Global styles
│   │   ├── api/
│   │   │   └── client.ts              # fetch wrapper (same pattern as zora)
│   │   ├── components/
│   │   │   ├── BvaForm.tsx            # Main form with all sections
│   │   │   ├── FormSection.tsx        # Collapsible Tile section
│   │   │   ├── CurrencyInput.tsx      # TextInput with $ prefix + comma formatting
│   │   │   └── PercentInput.tsx       # TextInput with % suffix
│   │   ├── lib/
│   │   │   ├── types.ts              # BvaInputs interface
│   │   │   └── defaults.ts           # Default values for all inputs
│   │   └── constants/
│   │       └── index.ts              # Labels, descriptions, section config
│   └── public/
```

---

## API Contract

### `POST /api/generate`

**Request** (JSON):
```json
{
  "customer_name": "Acme Corp",          // REQUIRED — only field with no default
  "report_date": "April 2026",           // auto-filled from current date
  "discount_rate": 0.10,
  "ramp_yr1": 0.90, "ramp_yr2": 0.95, "ramp_yr3": 1.00,
  "num_dbas": 20,
  "dba_annual_pay": 180000,
  "dba_ops_pct": 0.85,
  "ops_reduction_pct": 0.30,
  "incidents_per_year": 40,
  "cost_per_incident": 50000,
  "mttr_reduction_pct": 0.30,
  "num_tools": 4,
  "cost_per_tool": 25000,
  "sev1_per_year": 2,
  "cost_per_sev1": 250000,
  "sev1_reduction_pct": 0.50,
  "invest_yr1": 0, "invest_yr2": 0, "invest_yr3": 0
}
```

All percentages as decimals (0.85 not 85). Frontend converts before sending.

**Response**: PPTX binary with `Content-Disposition: attachment; filename="Acme_Corp_BVA.pptx"`

**Errors**: 422 for validation failures, 500 for generation errors (JSON `{"detail": "..."}`)

---

## Frontend Design

### Stack (matching zora-customer-survey)
- React 18 + TypeScript + Vite
- `@carbon/react` for UI components (TextInput, NumberInput, Button, Tile, Accordion, Header)
- Carbon dark theme (g90)
- Plain `fetch` in `api/client.ts`
- `useState` for form state
- Single-page form (no routing needed — it's just one page)

### Form Layout (5 sections using Carbon `Tile` / `Accordion`)

**Section 1: Customer Information** (always visible)
- `customer_name` — Carbon `TextInput`, **required**, placeholder "Enter customer name"
- `report_date` — Carbon `TextInput`, auto-filled with current month/year

**Section 2: Investment (Optional)** (Carbon `AccordionItem` — collapsed by default)
- `invest_yr1`, `invest_yr2`, `invest_yr3` — CurrencyInput (3 in a row)
- `discount_rate` — PercentInput, default 10%
- Helper text: "Leave at $0 for benefits-only analysis"

**Section 3: DBA Productivity Assumptions** (expanded)
- `num_dbas` — Carbon `NumberInput`, default 20
- `dba_annual_pay` — CurrencyInput, default $180,000
- `dba_ops_pct` — PercentInput, default 85%
- `ops_reduction_pct` — PercentInput, default 30%

**Section 4: Incident & Risk Assumptions** (expanded)
- `incidents_per_year` — NumberInput, default 40
- `cost_per_incident` — CurrencyInput, default $50,000
- `mttr_reduction_pct` — PercentInput, default 30%
- `sev1_per_year` — NumberInput, default 2
- `cost_per_sev1` — CurrencyInput, default $250,000
- `sev1_reduction_pct` — PercentInput, default 50%

**Section 5: Tool Consolidation & Ramp** (expanded)
- `num_tools` — NumberInput, default 4
- `cost_per_tool` — CurrencyInput, default $25,000
- `ramp_yr1`, `ramp_yr2`, `ramp_yr3` — 3 PercentInputs in a row, defaults 90/95/100%

**Generate Button**: Carbon `Button` (primary), "Generate BVA Deck", full-width at bottom. Shows `InlineLoading` during generation. Triggers blob download on success, `InlineNotification` (error) on failure.

### Custom Components

**`CurrencyInput`**: Wraps Carbon `TextInput`. Shows `$` prefix. On blur, formats with commas. Stores raw number. On focus, shows raw number for editing.

**`PercentInput`**: Wraps Carbon `TextInput`. Shows `%` suffix. Stores display value (85); `api/client.ts` divides by 100 before sending.

**`FormSection`**: Wraps Carbon `Tile` with a heading. For the Investment section, uses `AccordionItem` so it's collapsible.

### api/client.ts (same pattern as zora-customer-survey)

```typescript
const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:8000/api';

export async function generateBva(inputs: BvaInputs): Promise<Blob> {
  const payload = {
    ...inputs,
    discount_rate: inputs.discount_rate / 100,
    ramp_yr1: inputs.ramp_yr1 / 100,
    // ... all percentage fields divided by 100
  };
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Generation failed');
  }
  return res.blob();
}
```

---

## Backend Design

### Files & Responsibilities

| File | Purpose |
|------|---------|
| `models.py` | `BvaRequest` (Pydantic, 21 fields, validates ranges) + `BvaCalculations` (dataclass, ~40 computed values) |
| `calculator.py` | `calculate(BvaRequest) → BvaCalculations` — pure math, no I/O |
| `formatting.py` | `fmt_currency_full($2,616,300)`, `fmt_currency_short($2.62M)`, `fmt_percentage(85%)`, `fmt_investment_cell($X or ---)` |
| `slide_updaters.py` | One function per dynamic slide (11 functions). Each takes slide + inputs + calcs, modifies runs/cells in-place |
| `chart_builder.py` | Slide 6: `replace_data()` on existing chart. Slides 2 & 3: delete PNG → `add_chart()` at same position |
| `pptx_generator.py` | Opens template, calls all updaters + chart builders, saves to BytesIO, returns bytes |
| `main.py` | FastAPI app, CORS (allow localhost:5173 for Vite dev), single `POST /api/generate` endpoint |

### Key Implementation Details

**Template path**: `Path(__file__).resolve().parent.parent / "Db2GeniusHub_BVA.pptx"`

**Formatting — short currency rules**:
- ≥ $1M → `$X.XXM` (strip trailing zeros: `$10M` not `$10.00M`)
- ≥ $1K → `$XXXK` (round to nearest K)
- < $1K → `$XXX`

**Text replacement strategy**: Modify `run.text` directly (preserves font, size, bold, color). Each slide updater references exact shape index + para index + run index per the docs in `docs/slides/`.

**Chart conversion (slides 2 & 3)**: Read position/size from existing PNG shape → remove element from XML → `slide.shapes.add_chart()` at same coordinates → apply IBM color styling.

**Known gotchas**:
- Slide 3: Shapes 0, 3, 4, 5 all named `"Google Shape;207;p25"` — must use shape index, not name
- Slide 6: Chart is at Shape 16 > Sub 0 (inside a GROUP shape) — must iterate group's `.shapes`
- Run splitting: PowerPoint may split text across XML runs differently than expected — verify during development

### Calculation Chain

```
Step 1: 4 benefit categories → yr1/yr2/yr3/total each
  DBA:  ops_portion = num_dbas × dba_annual_pay × dba_ops_pct
        dba_yrN = ops_portion × ops_reduction_pct × ramp_yrN
  MTTR: annual_incident_cost = incidents_per_year × cost_per_incident
        mttr_yrN = annual_incident_cost × mttr_reduction_pct × ramp_yrN
  SEV1: baseline = sev1_per_year × cost_per_sev1
        sev1_yrN = baseline × sev1_reduction_pct × ramp_yrN
  Tool: base = num_tools × cost_per_tool
        tool_yrN = base × ramp_yrN

Step 2: Aggregate
  benefit_yrN = sev1_yrN + dba_yrN + mttr_yrN + tool_yrN
  total_3yr_benefits = benefit_yr1 + benefit_yr2 + benefit_yr3

Step 3: Financial KPIs
  total_investment = invest_yr1 + invest_yr2 + invest_yr3
  net_yrN = benefit_yrN - invest_yrN
  net_total = Σ net_yrN
  roi_pct = (total_3yr_benefits - total_investment) / total_investment × 100
    → 0.0% if investment is 0
  npv = Σ net_yrN / (1 + discount_rate)^N
  cost_of_delay_3mo = npv / 12
  payback_period = "Immediate" if investment is 0 or benefit_yr1 ≥ invest_yr1
```

All formulas documented in `docs/slides/00-master-inputs-and-calculations.md`.

---

## Input Classification

| Input | Required? | Default | Auto-filled? | Notes |
|-------|-----------|---------|-------------|-------|
| `customer_name` | **YES** | — | No | No sensible default |
| `report_date` | No | Current month/year | **Yes** | Auto-generated |
| `ramp_yr1/2/3` | No | 90/95/100% | **Yes** | IBM standard ramp |
| `discount_rate` | No | 10% | **Yes** | Industry standard |
| `num_dbas` | No | 20 | **Yes** | User should review — varies by customer |
| `dba_annual_pay` | No | $180,000 | **Yes** | Industry average |
| `dba_ops_pct` | No | 85% | **Yes** | Common assumption |
| `ops_reduction_pct` | No | 30% | **Yes** | Genius Hub benchmark |
| `incidents_per_year` | No | 40 | **Yes** | User should review — varies by customer |
| `cost_per_incident` | No | $50,000 | **Yes** | Industry average |
| `mttr_reduction_pct` | No | 30% | **Yes** | Genius Hub benchmark |
| `num_tools` | No | 4 | **Yes** | Common count |
| `cost_per_tool` | No | $25,000 | **Yes** | Industry average |
| `sev1_per_year` | No | 2 | **Yes** | Conservative default |
| `cost_per_sev1` | No | $250,000 | **Yes** | FinServ industry average |
| `sev1_reduction_pct` | No | 50% | **Yes** | Genius Hub benchmark |
| `invest_yr1/2/3` | No | $0 | **Yes** | Optional; shows "---" when 0 |

**Only `customer_name` is truly required.** All 20 other fields are pre-filled with sensible defaults. User can generate a valid deck after entering just the customer name.

---

## Build Order

### Phase 1: Backend Core
1. `backend/requirements.txt` + `backend/models.py` + `backend/formatting.py`
2. `backend/calculator.py` — implement full calculation chain
3. `backend/slide_updaters.py` — 11 per-slide update functions
4. `backend/chart_builder.py` — 3 chart functions
5. `backend/pptx_generator.py` + `backend/main.py` — wire up and test with curl

### Phase 2: Frontend
6. Scaffold Vite + React + Carbon (matching zora-customer-survey's setup)
7. `src/lib/types.ts` + `src/lib/defaults.ts` + `src/api/client.ts`
8. `src/components/` — CurrencyInput, PercentInput, FormSection
9. `src/components/BvaForm.tsx` — main form with all 5 sections
10. `src/App.tsx` + `src/main.tsx` — Carbon theme, header, render form

### Phase 3: Integration & Test
11. End-to-end: fill form → generate → open PPTX in PowerPoint
12. Verify all 14 slides, all numbers, all charts, formatting preserved

---

## Verification Plan

1. **Calculator test**: Default inputs → `total_3yr_benefits` must equal `$5,323,800`
2. **curl test**: `POST /api/generate {"customer_name":"Test Corp"}` → save and open PPTX
3. **Visual comparison**: Generated deck vs original template with same default values — every number must match
4. **Edge cases**: Custom values + investment → verify ROI, NPV, payback, "---" handling
5. **E2E**: Open localhost:5173 → enter customer name → Generate → PPTX downloads and opens correctly
