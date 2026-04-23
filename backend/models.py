from dataclasses import dataclass
from datetime import datetime

from pydantic import BaseModel, Field


class TradeUpItem(BaseModel):
    source_product: str = Field(..., min_length=1)
    source_quantity: int = Field(..., ge=1)
    discount_pct: float = Field(default=0.0, ge=0, le=1)


class BvaRequest(BaseModel):
    # Required
    customer_name: str = Field(..., min_length=1)

    # Auto-filled
    report_date: str = Field(default_factory=lambda: datetime.now().strftime("%B %Y"))
    discount_rate: float = Field(default=0.10, ge=0, le=1)

    # Trade-up line items (optional)
    trade_up_items: list[TradeUpItem] = Field(default_factory=list)
    current_s_and_s_total: float = Field(default=0.0, ge=0)  # deal-level; display only
    renewal_date: str = Field(default="")                     # deal-level; free-form e.g. "August 2026"
    trade_up_notes: str = Field(default="")                   # deal-level; optional seller note

    # DBA Productivity
    num_dbas: int = Field(default=20, ge=0)
    dba_annual_pay: float = Field(default=180000, ge=0)
    dba_ops_pct: float = Field(default=0.85, ge=0, le=1)
    ops_reduction_pct: float = Field(default=0.30, ge=0, le=1)

    # MTTR Reduction — incidents_per_year is required (customer-specific)
    incidents_per_year: int = Field(..., ge=0)
    cost_per_incident: float = Field(default=50000, ge=0)
    mttr_reduction_pct: float = Field(default=0.30, ge=0, le=1)

    # SEV-1 Avoidance — sev1_per_year is required (customer-specific)
    sev1_per_year: int = Field(..., ge=0)
    cost_per_sev1: float = Field(default=250000, ge=0)
    sev1_reduction_pct: float = Field(default=0.50, ge=0, le=1)

    # Tool Consolidation
    num_tools: int = Field(default=4, ge=0)
    cost_per_tool: float = Field(default=25000, ge=0)

    # Hardware investment (software cost is derived from trade_up_items)
    hw_yr1: float = Field(default=0, ge=0)
    hw_yr2: float = Field(default=0, ge=0)
    hw_yr3: float = Field(default=0, ge=0)


@dataclass
class BvaCalculations:
    # DBA Productivity
    total_dba_labor: float
    ops_portion: float
    dba_yr1: float
    dba_yr2: float
    dba_yr3: float
    dba_total: float

    # MTTR Reduction
    annual_incident_cost: float
    mttr_yr1: float
    mttr_yr2: float
    mttr_yr3: float
    mttr_total: float

    # SEV-1 Avoidance
    baseline_sev1_cost: float
    sev1_yr1: float
    sev1_yr2: float
    sev1_yr3: float
    sev1_total: float

    # Tool Consolidation
    tool_base: float
    tool_yr1: float
    tool_yr2: float
    tool_yr3: float
    tool_total: float

    # Aggregates
    benefit_yr1: float
    benefit_yr2: float
    benefit_yr3: float
    total_3yr_benefits: float

    # Financial KPIs
    total_investment: float
    net_yr1: float
    net_yr2: float
    net_yr3: float
    net_total: float
    roi_pct: float
    npv: float
    cost_of_delay_3mo: float
    payback_period: str
