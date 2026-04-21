from copy import deepcopy

from lxml import etree
from pptx.dml.color import RGBColor
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

from calculator import RAMP_YR1, RAMP_YR2, RAMP_YR3
from formatting import (
    fmt_currency_full,
    fmt_currency_short,
    fmt_investment_cell,
    fmt_percentage,
    fmt_roi,
)
from models import BvaCalculations, BvaRequest


def _set_cell(table, row, col, text):
    """Update a table cell's first run text, preserving formatting."""
    cell = table.cell(row, col)
    for para in cell.text_frame.paragraphs:
        for run in para.runs:
            run.text = str(text)
            return
    cell.text_frame.paragraphs[0].text = str(text)


def _set_source_cell(table, row, col, text):
    """Set text with explicit font formatting for the source column."""
    cell = table.cell(row, col)
    for para in cell.text_frame.paragraphs:
        for run in para.runs:
            run.text = str(text)
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(0x39, 0x39, 0x39)
            run.font.name = "IBM Plex Sans"
            return
    # Fallback
    p = cell.text_frame.paragraphs[0]
    p.text = str(text)
    p.font.size = Pt(10)
    p.font.color.rgb = RGBColor(0x39, 0x39, 0x39)
    p.font.name = "IBM Plex Sans"


# ---------------------------------------------------------------------------
# Slide 1 (index 0): Title
# ---------------------------------------------------------------------------
def update_slide_01(slide, inputs: BvaRequest):
    title = slide.shapes[0]
    para = title.text_frame.paragraphs[0]
    para.runs[0].text = inputs.customer_name   # bold, 93.98pt
    para.runs[4].text = inputs.report_date


# ---------------------------------------------------------------------------
# Slide 2 (index 1): Benefits Overview Table
# ---------------------------------------------------------------------------
def update_slide_02(slide, inputs: BvaRequest, calcs: BvaCalculations):
    # Title
    title = slide.shapes[0]
    para = title.text_frame.paragraphs[0]
    para.runs[0].text = para.runs[0].text.replace("<Customer>", inputs.customer_name)
    para.runs[1].text = fmt_currency_short(calcs.total_3yr_benefits)

    # Table (6 rows × 5 cols)
    table = slide.shapes[1].table

    # Row 1: SEV-1
    _set_cell(table, 1, 1, fmt_currency_full(calcs.sev1_yr1))
    _set_cell(table, 1, 2, fmt_currency_full(calcs.sev1_yr2))
    _set_cell(table, 1, 3, fmt_currency_full(calcs.sev1_yr3))
    _set_cell(table, 1, 4, fmt_currency_full(calcs.sev1_total))

    # Row 2: DBA Productivity
    _set_cell(table, 2, 1, fmt_currency_full(calcs.dba_yr1))
    _set_cell(table, 2, 2, fmt_currency_full(calcs.dba_yr2))
    _set_cell(table, 2, 3, fmt_currency_full(calcs.dba_yr3))
    _set_cell(table, 2, 4, fmt_currency_full(calcs.dba_total))

    # Row 3: MTTR Reduction
    _set_cell(table, 3, 1, fmt_currency_full(calcs.mttr_yr1))
    _set_cell(table, 3, 2, fmt_currency_full(calcs.mttr_yr2))
    _set_cell(table, 3, 3, fmt_currency_full(calcs.mttr_yr3))
    _set_cell(table, 3, 4, fmt_currency_full(calcs.mttr_total))

    # Row 4: Tool Consolidation
    _set_cell(table, 4, 1, fmt_currency_full(calcs.tool_yr1))
    _set_cell(table, 4, 2, fmt_currency_full(calcs.tool_yr2))
    _set_cell(table, 4, 3, fmt_currency_full(calcs.tool_yr3))
    _set_cell(table, 4, 4, fmt_currency_full(calcs.tool_total))

    # Row 5: Totals (bold)
    _set_cell(table, 5, 1, fmt_currency_full(calcs.benefit_yr1))
    _set_cell(table, 5, 2, fmt_currency_full(calcs.benefit_yr2))
    _set_cell(table, 5, 3, fmt_currency_full(calcs.benefit_yr3))
    _set_cell(table, 5, 4, fmt_currency_full(calcs.total_3yr_benefits))


# ---------------------------------------------------------------------------
# Slide 3 (index 2): Business Case Summary
# ---------------------------------------------------------------------------
def update_slide_03(slide, calcs: BvaCalculations):
    shapes = slide.shapes

    # KPI boxes
    shapes[0].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.total_3yr_benefits)
    shapes[3].text_frame.paragraphs[0].runs[0].text = fmt_roi(calcs.roi_pct)
    shapes[4].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.cost_of_delay_3mo)
    shapes[5].text_frame.paragraphs[0].runs[0].text = calcs.payback_period
    shapes[6].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.npv)

    # Summary table (4 rows × 5 cols)
    table = shapes[9].table

    # Row 1: Benefits
    _set_cell(table, 1, 1, fmt_currency_full(calcs.benefit_yr1))
    _set_cell(table, 1, 2, fmt_currency_full(calcs.benefit_yr2))
    _set_cell(table, 1, 3, fmt_currency_full(calcs.benefit_yr3))
    _set_cell(table, 1, 4, fmt_currency_full(calcs.total_3yr_benefits))

    # Row 2: Investment
    inv_yr1 = calcs.benefit_yr1 - calcs.net_yr1
    inv_yr2 = calcs.benefit_yr2 - calcs.net_yr2
    inv_yr3 = calcs.benefit_yr3 - calcs.net_yr3
    _set_cell(table, 2, 1, fmt_investment_cell(inv_yr1))
    _set_cell(table, 2, 2, fmt_investment_cell(inv_yr2))
    _set_cell(table, 2, 3, fmt_investment_cell(inv_yr3))
    _set_cell(table, 2, 4, fmt_investment_cell(calcs.total_investment))

    # Row 3: Net Benefit (bold)
    _set_cell(table, 3, 1, fmt_currency_full(calcs.net_yr1))
    _set_cell(table, 3, 2, fmt_currency_full(calcs.net_yr2))
    _set_cell(table, 3, 3, fmt_currency_full(calcs.net_yr3))
    _set_cell(table, 3, 4, fmt_currency_full(calcs.net_total))

    # Narrative text (Shape[10])
    narrative = shapes[10].text_frame.paragraphs[0]
    narrative.runs[1].text = fmt_currency_short(calcs.total_3yr_benefits) + " "
    narrative.runs[3].text = fmt_currency_short(calcs.net_total) + " "
    narrative.runs[5].text = f"3-year ROI of {fmt_roi(calcs.roi_pct)}"


# ---------------------------------------------------------------------------
# Slide 4 (index 3): Why Now?
# ---------------------------------------------------------------------------
def update_slide_04(slide, inputs: BvaRequest, calcs: BvaCalculations):
    shape = slide.shapes[10]
    shape.text_frame.paragraphs[0].runs[1].text = inputs.customer_name
    shape.text_frame.paragraphs[1].runs[0].text = fmt_currency_short(calcs.cost_of_delay_3mo) + " "


# ---------------------------------------------------------------------------
# Slide 5 (index 4): Key Assumptions + Sources
# ---------------------------------------------------------------------------

# Sources for each assumption row (row index → short citation)
_SOURCES = {
    0: "Source",
    1: "Forrester TEI",
    2: "Customer-provided",
    3: "BLS OEWS May 2024",
    4: "IDC Oracle DB Study",
    5: "Gartner IOCS 2024",
    6: "Customer-provided *",
    7: "ITIC 2022; Ponemon 2016",
    8: "Gartner 2024; Forrester TEI",
    9: "New Relic 2025 (n=1,700)",
    10: "Forrester TEI; Capterra",
    11: "Customer-provided *",
    12: "IBM/Ponemon 2023",
    13: "Forrester TEI (IBM Instana)",
}


def _add_source_column(table_shape):
    """Add a third 'Source' column to the 2-column Key Assumptions table."""
    tbl_el = table_shape.table._tbl

    # --- Resize grid: shrink col 0, add col 2 ---
    grid = tbl_el.find(qn("a:tblGrid"))
    gridCols = grid.findall(qn("a:gridCol"))
    source_col_width = 4500000  # ~4.9 inches
    old_col0_w = int(gridCols[0].get("w"))
    gridCols[0].set("w", str(old_col0_w - source_col_width))

    new_gc = deepcopy(gridCols[-1])
    new_gc.set("w", str(source_col_width))
    grid.append(new_gc)

    # --- Add a cloned cell to each row ---
    for tr in tbl_el.findall(qn("a:tr")):
        cells = tr.findall(qn("a:tc"))
        new_tc = deepcopy(cells[-1])  # clone value-column cell (inherits formatting)
        tr.append(new_tc)


def update_slide_05(slide, inputs: BvaRequest):
    table_shape = slide.shapes[4]
    table = table_shape.table

    # Populate values (col 1)
    ramp_str = f"{fmt_percentage(RAMP_YR1)}, {fmt_percentage(RAMP_YR2)}, {fmt_percentage(RAMP_YR3)}"
    _set_cell(table, 1, 1, ramp_str)
    _set_cell(table, 2, 1, str(inputs.num_dbas))
    _set_cell(table, 3, 1, fmt_currency_full(inputs.dba_annual_pay))
    _set_cell(table, 4, 1, fmt_percentage(inputs.dba_ops_pct))
    _set_cell(table, 5, 1, fmt_percentage(inputs.ops_reduction_pct))
    _set_cell(table, 6, 1, str(inputs.incidents_per_year))
    _set_cell(table, 7, 1, fmt_currency_full(inputs.cost_per_incident))
    _set_cell(table, 8, 1, fmt_percentage(inputs.mttr_reduction_pct))
    _set_cell(table, 9, 1, str(inputs.num_tools))
    _set_cell(table, 10, 1, fmt_currency_full(inputs.cost_per_tool))
    _set_cell(table, 11, 1, str(inputs.sev1_per_year))
    _set_cell(table, 12, 1, fmt_currency_full(inputs.cost_per_sev1))
    _set_cell(table, 13, 1, fmt_percentage(inputs.sev1_reduction_pct))

    # Add source column (col 2) and populate with explicit formatting
    _add_source_column(table_shape)
    for row_idx, source_text in _SOURCES.items():
        _set_source_cell(table, row_idx, 2, source_text)


# ---------------------------------------------------------------------------
# Slide 6 (index 5): Executive Summary
# ---------------------------------------------------------------------------
def update_slide_06(slide, inputs: BvaRequest, calcs: BvaCalculations):
    shapes = slide.shapes

    # Value Proposition — replace <Customer>
    shapes[0].text_frame.paragraphs[1].runs[0].text = (
        shapes[0].text_frame.paragraphs[1].runs[0].text.replace("<Customer>", inputs.customer_name)
    )

    # Narrative — replace Customer + total
    shapes[1].text_frame.paragraphs[0].runs[0].text = (
        shapes[1].text_frame.paragraphs[0].runs[0].text.replace("Customer", inputs.customer_name)
    )
    shapes[1].text_frame.paragraphs[0].runs[1].text = fmt_currency_short(calcs.total_3yr_benefits) + " "

    # Solutions text — replace all 3 <Customer>
    shapes[2].text_frame.paragraphs[1].runs[0].text = (
        shapes[2].text_frame.paragraphs[1].runs[0].text.replace("<Customer>", inputs.customer_name)
    )

    # KPI boxes
    shapes[5].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.total_3yr_benefits)
    shapes[6].text_frame.paragraphs[0].runs[0].text = calcs.payback_period
    shapes[7].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.npv)
    shapes[11].text_frame.paragraphs[0].runs[0].text = fmt_roi(calcs.roi_pct)


# ---------------------------------------------------------------------------
# Slide 8 (index 7): DBA Productivity Detail
# ---------------------------------------------------------------------------
def update_slide_08(slide, inputs: BvaRequest, calcs: BvaCalculations):
    # Headline
    slide.shapes[2].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.dba_total)

    # Table (9 rows × 5 cols)
    table = slide.shapes[5].table
    _set_cell(table, 0, 2, str(inputs.num_dbas))
    _set_cell(table, 1, 2, fmt_currency_full(inputs.dba_annual_pay))
    _set_cell(table, 2, 2, fmt_percentage(inputs.dba_ops_pct))
    _set_cell(table, 3, 2, fmt_percentage(inputs.ops_reduction_pct))
    _set_cell(table, 4, 2, fmt_currency_full(calcs.total_dba_labor))
    _set_cell(table, 5, 2, fmt_currency_full(calcs.ops_portion))
    _set_cell(table, 7, 2, fmt_percentage(RAMP_YR1))
    _set_cell(table, 7, 3, fmt_percentage(RAMP_YR2))
    _set_cell(table, 7, 4, fmt_percentage(RAMP_YR3))
    _set_cell(table, 8, 2, fmt_currency_full(calcs.dba_yr1))
    _set_cell(table, 8, 3, fmt_currency_full(calcs.dba_yr2))
    _set_cell(table, 8, 4, fmt_currency_full(calcs.dba_yr3))


# ---------------------------------------------------------------------------
# Slide 9 (index 8): MTTR Reduction Detail
# ---------------------------------------------------------------------------
def update_slide_09(slide, inputs: BvaRequest, calcs: BvaCalculations):
    slide.shapes[2].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.mttr_total)

    table = slide.shapes[5].table
    _set_cell(table, 0, 2, str(inputs.incidents_per_year))
    _set_cell(table, 1, 2, fmt_currency_full(inputs.cost_per_incident))
    _set_cell(table, 2, 2, fmt_percentage(inputs.mttr_reduction_pct))
    _set_cell(table, 3, 2, fmt_currency_full(calcs.annual_incident_cost))
    _set_cell(table, 5, 2, fmt_percentage(RAMP_YR1))
    _set_cell(table, 5, 3, fmt_percentage(RAMP_YR2))
    _set_cell(table, 5, 4, fmt_percentage(RAMP_YR3))
    _set_cell(table, 6, 2, fmt_currency_full(calcs.mttr_yr1))
    _set_cell(table, 6, 3, fmt_currency_full(calcs.mttr_yr2))
    _set_cell(table, 6, 4, fmt_currency_full(calcs.mttr_yr3))


# ---------------------------------------------------------------------------
# Slide 10 (index 9): SEV-1 Avoidance Detail
# ---------------------------------------------------------------------------
def update_slide_10(slide, inputs: BvaRequest, calcs: BvaCalculations):
    slide.shapes[2].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.sev1_total)

    table = slide.shapes[5].table
    _set_cell(table, 0, 2, str(inputs.sev1_per_year))
    _set_cell(table, 1, 2, fmt_currency_full(inputs.cost_per_sev1))
    _set_cell(table, 2, 2, fmt_percentage(inputs.sev1_reduction_pct))
    _set_cell(table, 3, 2, fmt_currency_full(calcs.baseline_sev1_cost))
    _set_cell(table, 5, 2, fmt_percentage(RAMP_YR1))
    _set_cell(table, 5, 3, fmt_percentage(RAMP_YR2))
    _set_cell(table, 5, 4, fmt_percentage(RAMP_YR3))
    _set_cell(table, 6, 2, fmt_currency_full(calcs.sev1_yr1))
    _set_cell(table, 6, 3, fmt_currency_full(calcs.sev1_yr2))
    _set_cell(table, 6, 4, fmt_currency_full(calcs.sev1_yr3))


# ---------------------------------------------------------------------------
# Slide 11 (index 10): Tool Consolidation Detail
# ---------------------------------------------------------------------------
def update_slide_11(slide, inputs: BvaRequest, calcs: BvaCalculations):
    slide.shapes[2].text_frame.paragraphs[0].runs[0].text = fmt_currency_short(calcs.tool_total)

    table = slide.shapes[5].table
    _set_cell(table, 0, 2, str(inputs.num_tools))
    _set_cell(table, 1, 2, fmt_currency_full(inputs.cost_per_tool))
    _set_cell(table, 3, 2, fmt_percentage(RAMP_YR1))
    _set_cell(table, 3, 3, fmt_percentage(RAMP_YR2))
    _set_cell(table, 3, 4, fmt_percentage(RAMP_YR3))
    _set_cell(table, 4, 2, fmt_currency_full(calcs.tool_yr1))
    _set_cell(table, 4, 3, fmt_currency_full(calcs.tool_yr2))
    _set_cell(table, 4, 4, fmt_currency_full(calcs.tool_yr3))


# ---------------------------------------------------------------------------
# Slide 12 (index 11): Annual Benefit per Value Driver
# ---------------------------------------------------------------------------
def update_slide_12(slide, calcs: BvaCalculations):
    shapes = slide.shapes

    # DBA Productivity
    _set_cell(shapes[2].table, 1, 2, fmt_currency_short(calcs.dba_yr3))
    shapes[3].text_frame.paragraphs[0].runs[0].text = (
        f"DBA Productivity & Labor Cost Avoidance annual benefits are estimated at {fmt_currency_short(calcs.dba_yr3)} "
    )

    # MTTR Reduction
    _set_cell(shapes[4].table, 1, 2, fmt_currency_short(calcs.mttr_yr3))
    shapes[5].text_frame.paragraphs[0].runs[0].text = (
        f"Faster Incident Resolution (MTTR Reduction) annual benefits are estimated at {fmt_currency_short(calcs.mttr_yr3)} "
    )

    # SEV-1 Avoidance
    _set_cell(shapes[6].table, 1, 2, fmt_currency_short(calcs.sev1_yr3))
    shapes[7].text_frame.paragraphs[0].runs[0].text = (
        f"Avoided Severe Incidents & Downtime Risk annual benefits are estimated at {fmt_currency_short(calcs.sev1_yr3)} "
    )

    # Tool Consolidation
    _set_cell(shapes[8].table, 1, 2, fmt_currency_short(calcs.tool_yr3))
    shapes[9].text_frame.paragraphs[0].runs[0].text = (
        f"Tool Consolidation & Operational Efficiency annual benefits are estimated at {fmt_currency_short(calcs.tool_yr3)} "
    )
