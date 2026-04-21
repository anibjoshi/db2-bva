from models import BvaCalculations, BvaRequest

# Benefit realization ramp — internal methodology constant (Forrester TEI standard)
# Not exposed as user input; represents adoption maturity over 3 years
RAMP_YR1 = 0.90
RAMP_YR2 = 0.95
RAMP_YR3 = 1.00


def calculate(inputs: BvaRequest) -> BvaCalculations:
    # --- DBA Productivity ---
    total_dba_labor = inputs.num_dbas * inputs.dba_annual_pay
    ops_portion = total_dba_labor * inputs.dba_ops_pct
    dba_yr1 = ops_portion * inputs.ops_reduction_pct * RAMP_YR1
    dba_yr2 = ops_portion * inputs.ops_reduction_pct * RAMP_YR2
    dba_yr3 = ops_portion * inputs.ops_reduction_pct * RAMP_YR3
    dba_total = dba_yr1 + dba_yr2 + dba_yr3

    # --- MTTR Reduction ---
    annual_incident_cost = inputs.incidents_per_year * inputs.cost_per_incident
    mttr_yr1 = annual_incident_cost * inputs.mttr_reduction_pct * RAMP_YR1
    mttr_yr2 = annual_incident_cost * inputs.mttr_reduction_pct * RAMP_YR2
    mttr_yr3 = annual_incident_cost * inputs.mttr_reduction_pct * RAMP_YR3
    mttr_total = mttr_yr1 + mttr_yr2 + mttr_yr3

    # --- SEV-1 Avoidance ---
    baseline_sev1_cost = inputs.sev1_per_year * inputs.cost_per_sev1
    sev1_yr1 = baseline_sev1_cost * inputs.sev1_reduction_pct * RAMP_YR1
    sev1_yr2 = baseline_sev1_cost * inputs.sev1_reduction_pct * RAMP_YR2
    sev1_yr3 = baseline_sev1_cost * inputs.sev1_reduction_pct * RAMP_YR3
    sev1_total = sev1_yr1 + sev1_yr2 + sev1_yr3

    # --- Tool Consolidation ---
    tool_base = inputs.num_tools * inputs.cost_per_tool
    tool_yr1 = tool_base * RAMP_YR1
    tool_yr2 = tool_base * RAMP_YR2
    tool_yr3 = tool_base * RAMP_YR3
    tool_total = tool_yr1 + tool_yr2 + tool_yr3

    # --- Aggregates ---
    benefit_yr1 = sev1_yr1 + dba_yr1 + mttr_yr1 + tool_yr1
    benefit_yr2 = sev1_yr2 + dba_yr2 + mttr_yr2 + tool_yr2
    benefit_yr3 = sev1_yr3 + dba_yr3 + mttr_yr3 + tool_yr3
    total_3yr_benefits = benefit_yr1 + benefit_yr2 + benefit_yr3

    # --- Financial KPIs ---
    total_investment = inputs.invest_yr1 + inputs.invest_yr2 + inputs.invest_yr3

    net_yr1 = benefit_yr1 - inputs.invest_yr1
    net_yr2 = benefit_yr2 - inputs.invest_yr2
    net_yr3 = benefit_yr3 - inputs.invest_yr3
    net_total = net_yr1 + net_yr2 + net_yr3

    if total_investment == 0:
        roi_pct = 0.0
    else:
        roi_pct = (total_3yr_benefits - total_investment) / total_investment * 100

    r = inputs.discount_rate
    npv = net_yr1 / (1 + r) + net_yr2 / (1 + r) ** 2 + net_yr3 / (1 + r) ** 3

    # Cost of delay = foregone benefit per quarter. Floor at $0 — if NPV is
    # negative the deal doesn't pay back, but "cost of doing nothing" shouldn't
    # show a negative number (that would imply delay is beneficial).
    cost_of_delay_3mo = max(npv / 12, 0.0)

    if total_investment == 0 or benefit_yr1 >= inputs.invest_yr1:
        payback_period = "Immediate"
    else:
        # Quarter-by-quarter cumulative net benefit
        quarterly_benefit = [
            benefit_yr1 / 4, benefit_yr1 / 4, benefit_yr1 / 4, benefit_yr1 / 4,
            benefit_yr2 / 4, benefit_yr2 / 4, benefit_yr2 / 4, benefit_yr2 / 4,
            benefit_yr3 / 4, benefit_yr3 / 4, benefit_yr3 / 4, benefit_yr3 / 4,
        ]
        quarterly_investment = [
            inputs.invest_yr1 / 4, inputs.invest_yr1 / 4,
            inputs.invest_yr1 / 4, inputs.invest_yr1 / 4,
            inputs.invest_yr2 / 4, inputs.invest_yr2 / 4,
            inputs.invest_yr2 / 4, inputs.invest_yr2 / 4,
            inputs.invest_yr3 / 4, inputs.invest_yr3 / 4,
            inputs.invest_yr3 / 4, inputs.invest_yr3 / 4,
        ]
        cumulative = 0.0
        payback_period = ">3 years"
        for q in range(12):
            cumulative += quarterly_benefit[q] - quarterly_investment[q]
            if cumulative >= 0:
                months = (q + 1) * 3
                payback_period = f"{months} months"
                break

    return BvaCalculations(
        total_dba_labor=total_dba_labor,
        ops_portion=ops_portion,
        dba_yr1=dba_yr1,
        dba_yr2=dba_yr2,
        dba_yr3=dba_yr3,
        dba_total=dba_total,
        annual_incident_cost=annual_incident_cost,
        mttr_yr1=mttr_yr1,
        mttr_yr2=mttr_yr2,
        mttr_yr3=mttr_yr3,
        mttr_total=mttr_total,
        baseline_sev1_cost=baseline_sev1_cost,
        sev1_yr1=sev1_yr1,
        sev1_yr2=sev1_yr2,
        sev1_yr3=sev1_yr3,
        sev1_total=sev1_total,
        tool_base=tool_base,
        tool_yr1=tool_yr1,
        tool_yr2=tool_yr2,
        tool_yr3=tool_yr3,
        tool_total=tool_total,
        benefit_yr1=benefit_yr1,
        benefit_yr2=benefit_yr2,
        benefit_yr3=benefit_yr3,
        total_3yr_benefits=total_3yr_benefits,
        total_investment=total_investment,
        net_yr1=net_yr1,
        net_yr2=net_yr2,
        net_yr3=net_yr3,
        net_total=net_total,
        roi_pct=roi_pct,
        npv=npv,
        cost_of_delay_3mo=cost_of_delay_3mo,
        payback_period=payback_period,
    )
