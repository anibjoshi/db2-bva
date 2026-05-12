import math
from dataclasses import dataclass


# Annual Software Subscription & Support, as a fraction of the (discounted)
# license cost. Standard IBM software maintenance rate.
S_AND_S_RATE = 0.20


@dataclass(frozen=True)
class CatalogEntry:
    source: str
    target: str
    pn: str
    ratio: float        # destination units per source unit
    list_price: float   # per destination unit
    license_cost: float # per destination unit


# Mirrors trade-up-numbers.csv; update both if pricing changes. S&S is no
# longer a per-entry value — it's computed as S_AND_S_RATE × license cost.
CATALOG: tuple[CatalogEntry, ...] = (
    CatalogEntry("Db2 Advanced Edition VPC",                    "Db2 AI Advanced Edition VPC", "D14TCZX", 1.0,    35_100, 15_200),
    CatalogEntry("Db2 Warehouse VPC",                           "Db2 AI Advanced Edition VPC", "D14TBZX", 1.0,    93_000, 73_100),
    CatalogEntry("Db2 Advanced Edition AU",                     "Db2 AI Advanced Edition AU",  "D14TFZX", 1.0,     1_510,    654),
    CatalogEntry("Db2 Advanced Enterprise Server Edition PVU",  "Db2 AI Advanced Edition VPC", "D15DHZX", 1 / 70, 34_100, 14_200),
    CatalogEntry("Db2 Enterprise Server Edition PVU",           "Db2 AI Advanced Edition VPC", "D15DGZX", 1 / 70, 59_300, 39_400),
    CatalogEntry("Db2 Standard Edition VPC",                    "Db2 AI Standard Edition VPC", "D14P2ZX", 1.0,    11_700,  6_600),
    CatalogEntry("Db2 Standard Edition AU",                     "Db2 AI Standard Edition AU",  "D14P0ZX", 1.0,       887,    501),
)

_BY_SOURCE: dict[str, CatalogEntry] = {e.source: e for e in CATALOG}


def get_entry(source: str) -> CatalogEntry:
    return _BY_SOURCE[source]


def list_sources() -> list[dict]:
    """Dropdown options for the frontend. `ratio` is destination units per
    source unit — the frontend uses it to normalize PVU quantities to VPCs
    when sizing the deployment for default-scaling. `license_cost` is per
    destination unit and lets the frontend show a live 3-year investment
    preview so sellers understand what ROI is calculated against. Annual
    S&S is derived as S_AND_S_RATE × license; the rate is reported once
    on the catalog response so the frontend doesn't hard-code it."""
    return [
        {
            "source": e.source,
            "target": e.target,
            "pn": e.pn,
            "ratio": e.ratio,
            "license_cost": e.license_cost,
        }
        for e in CATALOG
    ]


@dataclass(frozen=True)
class TradeUpCalculation:
    source: str
    target: str
    pn: str
    source_quantity: int
    destination_quantity: int  # always whole (ceil of source_qty × ratio)
    year1_total: float       # destination_qty × license × (1 − discount)
    annual_after_yr1: float  # S_AND_S_RATE × year1_total


def calculate_line_item(source: str, source_quantity: int, discount_pct: float) -> TradeUpCalculation:
    entry = get_entry(source)
    # Whole-license rounding — you can't buy a fractional VPC, so round up.
    destination_qty = math.ceil(source_quantity * entry.ratio)
    discount_mult = 1 - discount_pct
    year1_total = destination_qty * entry.license_cost * discount_mult
    return TradeUpCalculation(
        source=entry.source,
        target=entry.target,
        pn=entry.pn,
        source_quantity=source_quantity,
        destination_quantity=destination_qty,
        year1_total=year1_total,
        annual_after_yr1=year1_total * S_AND_S_RATE,
    )
