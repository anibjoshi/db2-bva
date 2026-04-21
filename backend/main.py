import json
from io import BytesIO
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from calculator import calculate
from models import BvaRequest
from pptx_generator import generate_pptx

app = FastAPI(title="BVA Deck Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Bva-Warnings"],
)


def _build_warnings(calcs) -> list[str]:
    warnings = []
    if calcs.roi_pct < 0:
        warnings.append(
            f"Negative ROI ({calcs.roi_pct:.1f}%) — investment exceeds projected benefits. "
            "Consider adjusting investment or benefit assumptions before presenting."
        )
    if calcs.total_3yr_benefits == 0:
        warnings.append("Total 3-year benefits are $0. Check that input values are non-zero.")
    if calcs.npv < 0:
        warnings.append(
            "Negative NPV — the deal does not pay back within 3 years at the current discount rate."
        )
    return warnings


@app.post("/api/generate")
async def generate(request: BvaRequest):
    calcs = calculate(request)
    pptx_bytes = generate_pptx(request, calcs)
    filename = f"{request.customer_name.replace(' ', '_')}_BVA.pptx"

    warnings = _build_warnings(calcs)
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    if warnings:
        headers["X-Bva-Warnings"] = json.dumps(warnings)

    return StreamingResponse(
        BytesIO(pptx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers=headers,
    )


# --- Serve frontend in production (Docker) ---
# Must be AFTER API routes — StaticFiles(html=True) serves index.html as fallback
_STATIC_DIR = Path(__file__).resolve().parent / "static"
if _STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(_STATIC_DIR), html=True), name="static")
