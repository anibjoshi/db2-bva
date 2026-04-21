from io import BytesIO
from pathlib import Path

from pptx import Presentation

from chart_builder import create_slide2_chart, create_slide3_chart, update_slide6_chart
from models import BvaCalculations, BvaRequest
from slide_updaters import (
    update_slide_01,
    update_slide_02,
    update_slide_03,
    update_slide_04,
    update_slide_05,
    update_slide_06,
    update_slide_08,
    update_slide_09,
    update_slide_10,
    update_slide_11,
    update_slide_12,
)

# Docker: template is alongside Python files; local dev: template is in project root
_HERE = Path(__file__).resolve().parent
TEMPLATE_PATH = _HERE / "Db2GeniusHub_BVA.pptx"
if not TEMPLATE_PATH.exists():
    TEMPLATE_PATH = _HERE.parent / "Db2GeniusHub_BVA.pptx"


def generate_pptx(inputs: BvaRequest, calcs: BvaCalculations) -> bytes:
    prs = Presentation(str(TEMPLATE_PATH))

    # Slide 1: Title
    update_slide_01(prs.slides[0], inputs)

    # Slide 2: Benefits Overview + taxonomy chart
    update_slide_02(prs.slides[1], inputs, calcs)
    create_slide2_chart(prs.slides[1], calcs)

    # Slide 3: Business Case Summary + summary chart
    update_slide_03(prs.slides[2], calcs)
    create_slide3_chart(prs.slides[2], calcs)

    # Slide 4: Why Now?
    update_slide_04(prs.slides[3], inputs, calcs)

    # Slide 5: Key Assumptions
    update_slide_05(prs.slides[4], inputs)

    # Slide 6: Executive Summary + bar chart
    update_slide_06(prs.slides[5], inputs, calcs)
    update_slide6_chart(prs.slides[5], calcs)

    # Slides 7, 13, 14: Static — skip

    # Slide 8: DBA Productivity Detail
    update_slide_08(prs.slides[7], inputs, calcs)

    # Slide 9: MTTR Reduction Detail
    update_slide_09(prs.slides[8], inputs, calcs)

    # Slide 10: SEV-1 Avoidance Detail
    update_slide_10(prs.slides[9], inputs, calcs)

    # Slide 11: Tool Consolidation Detail
    update_slide_11(prs.slides[10], inputs, calcs)

    # Slide 12: Annual Benefit per Driver
    update_slide_12(prs.slides[11], calcs)

    buf = BytesIO()
    prs.save(buf)
    return buf.getvalue()
