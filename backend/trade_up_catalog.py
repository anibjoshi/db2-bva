from dataclasses import dataclass


@dataclass(frozen=True)
class CatalogEntry:
    source: str
    target: str
    pn: str
    ratio: float        # destination units per source unit
    list_price: float   # per destination unit
    license_cost: float # per destination unit
    s_and_s: float      # per destination unit


# Mirrors trade-up-numbers.csv; update both if pricing changes.
CATALOG: tuple[CatalogEntry, ...] = (
    CatalogEntry("Db2 Advanced Edition VPC",                    "Db2 AI Advanced Edition VPC", "D14TCZX", 1.0,           35_100, 15_200, 19_900),
    CatalogEntry("Db2 Warehouse VPC",                           "Db2 AI Advanced Edition VPC", "D14TBZX", 1.0,           93_000, 73_100, 19_900),
    CatalogEntry("Db2 Advanced Edition AU",                     "Db2 AI Advanced Edition AU",  "D14TFZX", 1.0,            1_510,    654,    856),
    CatalogEntry("Db2 Advanced Enterprise Server Edition PVU",  "Db2 AI Advanced Edition VPC", "D15DHZX", 1 / 70,        34_100, 14_200, 19_900),
    CatalogEntry("Db2 Enterprise Server Edition PVU",           "Db2 AI Advanced Edition VPC", "D15DGZX", 1 / 70,        59_300, 39_400, 19_900),
    CatalogEntry("Db2 Standard Edition VPC",                    "Db2 AI Standard Edition VPC", "D14P2ZX", 1.0,           11_700,  6_600,  5_100),
    CatalogEntry("Db2 Standard Edition AU",                     "Db2 AI Standard Edition AU",  "D14P0ZX", 1.0,              887,    501,    386),
)

_BY_SOURCE: dict[str, CatalogEntry] = {e.source: e for e in CATALOG}


def get_entry(source: str) -> CatalogEntry:
    return _BY_SOURCE[source]


def list_sources() -> list[dict]:
    """Dropdown options for the frontend."""
    return [{"source": e.source, "target": e.target, "pn": e.pn} for e in CATALOG]


@dataclass(frozen=True)
class TradeUpCalculation:
    source: str
    target: str
    pn: str
    source_quantity: int
    destination_quantity: float
    year1_total: float       # destination_qty × license × (1 − discount)
    annual_after_yr1: float  # destination_qty × S&S     × (1 − discount)


def calculate_line_item(source: str, source_quantity: int, discount_pct: float) -> TradeUpCalculation:
    entry = get_entry(source)
    destination_qty = source_quantity * entry.ratio
    discount_mult = 1 - discount_pct
    return TradeUpCalculation(
        source=entry.source,
        target=entry.target,
        pn=entry.pn,
        source_quantity=source_quantity,
        destination_quantity=destination_qty,
        year1_total=destination_qty * entry.license_cost * discount_mult,
        annual_after_yr1=destination_qty * entry.s_and_s * discount_mult,
    )
