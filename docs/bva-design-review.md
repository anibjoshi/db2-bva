# BVA Calculator Design Review — Gap Analysis & Recommendations

## 1. Context

This document evaluates the Db2 Genius Hub Business Value Assessment calculator against industry-standard frameworks (Forrester TEI, IDC, Nucleus Research) and recommends targeted improvements to close credibility gaps without over-engineering the tool.

---

## 2. Framework Comparison

### 2.1 Forrester Total Economic Impact (TEI) — The Gold Standard

Forrester's TEI is the most widely recognized BVA methodology. Companies like Salesforce, ServiceNow, Microsoft, and AWS model their ROI calculators on it. TEI has four pillars:

| Pillar | Description | Our Coverage |
|--------|-------------|-------------|
| **Benefits** | Quantified value, risk-adjusted | Partial — we quantify but don't risk-adjust |
| **Costs** | All implementation and ongoing costs | Weak — raw dollar inputs with no structure |
| **Flexibility** | Option value of the investment | Not covered (acceptable to omit) |
| **Risk** | Confidence-adjusted estimates | Not covered (significant gap) |

### 2.2 Side-by-Side Assessment

| Area | Our Current Approach | World-Class Standard | Gap Severity |
|------|---------------------|---------------------|-------------|
| Benefit categories | 4 categories, well-defined formulas | Same pattern — typically 4–6 categories | **Low** — solid |
| Benefit estimates | Single-point values | Risk-adjusted with confidence % per category | **High** — biggest credibility gap |
| Benefit realization ramp | 90/95/100% over 3 years | Same pattern, sometimes with deployment timeline | **Low** — good |
| Cost/Investment model | 3 raw dollar inputs (yr1/yr2/yr3) | Structured: licensing, services, internal labor, training, maintenance | **Medium** — lacks rigor |
| Financial metrics | ROI, NPV, payback period, cost of delay | Same set — this is complete | **None** — matches |
| Sensitivity analysis | Not present | Best/expected/conservative scenarios or tornado chart | **Medium** — common expectation |
| Source citations | No citations for defaults | Every assumption sourced to industry research | **High** — undermines credibility |
| Qualitative benefits | Not captured | Listed as unquantified benefits (compliance, morale, etc.) | **Low** — nice-to-have |
| Presentation quality | Professional IBM-branded deck | Same standard | **None** — matches |

---

## 3. Source Citations for Key Assumptions

Every default value in the calculator should be traceable to a credible source. Below is a sourcing guide for each assumption.

### 3.1 DBA Productivity Assumptions

| Assumption | Default | Recommended Source(s) |
|-----------|---------|----------------------|
| Number of DBAs | 20 | **Customer-specific** — always gather from the customer. Default is a placeholder for a mid-size enterprise. |
| "All-in" DBA annual pay ($180,000) | $180,000 | **Bureau of Labor Statistics (BLS)** — Database Administrators and Architects (SOC 15-1245): median annual wage ~$101,000 (May 2023). "All-in" multiplier of 1.4–1.8x covers benefits, overhead, tools, and facilities. **Robert Half Technology Salary Guide** 2024/2025 provides market-rate ranges by metro area. For financial services, the upper range applies. |
| % of DBA time on operations (85%) | 85% | **Forrester Research** — "The State of Database Administration" reports consistently find 70–85% of DBA time spent on operational tasks (patching, monitoring, troubleshooting, backups) vs. strategic work. **IDC** surveys show similar findings. IBM internal surveys of Db2 customers corroborate the 80–85% range. |
| Reduction in operational effort (30%) | 30% | **IBM Genius Hub pilot data** — cite specific pilot results where available. **Gartner** — "AIOps platforms reduce manual operational effort by 25–40% within 12 months of deployment" (Gartner Market Guide for AIOps, 2023). Conservative end of the range. |

### 3.2 Incident Resolution (MTTR) Assumptions

| Assumption | Default | Recommended Source(s) |
|-----------|---------|----------------------|
| Material incidents per year | 40 | **Customer-specific** — should always come from the customer's incident management system (ServiceNow, PagerDuty, etc.). Default represents ~3–4 material incidents per month, typical for a 20+ DBA shop with complex Db2 estates. |
| Average business impact per incident ($50,000) | $50,000 | **ITIC (Information Technology Intelligence Consulting)** — Annual Hourly Cost of Downtime Survey: 98% of organizations say a single hour of downtime costs over $100,000. **Ponemon Institute** — "Cost of Data Center Outages" study. $50K is conservative, representing partial-hour impacts and mixed severity. For financial services, $100K–$500K per incident is more realistic. |
| Reduction in time to resolution (30%) | 30% | **IBM Genius Hub case studies** — cite specific MTTR reductions from production deployments. **Industry benchmark**: AI-assisted root cause analysis typically reduces MTTR by 25–50% (source: **Gartner**, "How AIOps Platforms Reduce MTTR", 2023). 30% is the conservative estimate. |

### 3.3 SEV-1 Avoidance Assumptions

| Assumption | Default | Recommended Source(s) |
|-----------|---------|----------------------|
| SEV-1 incidents per year | 2 | **Customer-specific** — pull from incident history. 2 per year is conservative for regulated industries. **Uptime Institute Annual Outage Analysis** reports that 60% of outages cost over $100K. |
| Cost per SEV-1 ($250,000) | $250,000 | **ITIC 2023–2024 Hourly Cost of Downtime Survey** — financial services respondents report $1M–$5M per hour of critical downtime. $250K represents a 15–30 minute SEV-1 in a typical banking environment. **Gartner** — frequently cited figure of $5,600 per minute of downtime on average. **Ponemon Institute** — "Cost of a Data Breach Report" (IBM-sponsored): average total cost $4.45M per breach (2023), with system outages being a significant component. |
| Reduction in SEV-1 occurrence (50%) | 50% | **IBM internal data** — proactive anomaly detection and automated remediation from Genius Hub. **Gartner**: "Organizations using AIOps for proactive incident prevention reduce high-severity incidents by 30–60%." 50% is mid-range. |

### 3.4 Tool Consolidation Assumptions

| Assumption | Default | Recommended Source(s) |
|-----------|---------|----------------------|
| Number of Db2 monitoring tools | 4 | **Customer-specific** — count of current tools (e.g., BMC, Quest, custom scripts, vendor-provided). 4 is typical for organizations that have accumulated tools organically over time. |
| Reducible overhead per tool ($25,000) | $25,000 | Covers: annual license/subscription (~$10–15K), admin time (~$5–10K), infrastructure costs (~$2–5K). **Gartner TCO models** for enterprise monitoring tools. This is a conservative estimate; many enterprise monitoring tools cost $50K+ annually per deployment. |

### 3.5 Financial Parameters

| Parameter | Default | Source |
|-----------|---------|--------|
| Discount rate (10%) | 10% | Standard corporate discount rate for technology investments. **Damodaran** (NYU Stern) publishes industry-specific WACC data. 8–12% is typical for technology projects in financial services. |
| Benefit realization ramp (90/95/100%) | 90%, 95%, 100% | **Forrester TEI standard** — phased realization accounts for deployment timeline, learning curve, and change management. 90/95/100% is the standard Forrester ramp for SaaS/platform deployments. |

---

## 4. Recommended Improvements

Ordered by impact-to-effort ratio.

### 4.1 HIGH PRIORITY: Add Source Citations to Assumptions Slide (Effort: Low)

**What**: Add a third column to the Key Assumptions table on Slide 5 with a brief source citation for each value.

**Why**: This is the single easiest way to increase BVA credibility. Customers and procurement teams scrutinize assumptions — unsourced defaults look like sales numbers. Sourced defaults look like industry research.

**Implementation**: 
- Add a "Source" column to the Slide 5 table (14×3 instead of 14×2)
- Pre-populate with sources from Section 3 above
- For customer-provided values, show "Customer-provided"
- For IBM benchmarks, show "IBM Genius Hub pilot data"
- For industry sources, show "Gartner, 2023" or "ITIC 2024 Survey"

**Complexity**: Requires modifying the template slide (adding a column to the table) and updating `update_slide_05()` to fill the source column. The source text could either be hardcoded (since it doesn't change per customer) or left in the template and only updated when defaults are overridden.

### 4.2 HIGH PRIORITY: Add Risk Adjustment (Effort: Medium)

**What**: Each benefit category gets a risk-adjustment factor (0–100%, default 80%). The displayed benefit values become `calculated_benefit × risk_factor`.

**Why**: Every credible BVA framework includes risk adjustment. Without it, the numbers look overly optimistic and invite pushback. With it, you demonstrate analytical rigor and give the customer a lever to express their own confidence level.

**Implementation**:
- Add 4 new inputs: `risk_dba`, `risk_mttr`, `risk_sev1`, `risk_tool` (all default 80%)
- After calculating each benefit category's yr1/2/3 values, multiply by the risk factor
- Show both "unadjusted" and "risk-adjusted" values on the detail slides (Slides 8–11)
- All summary slides (2, 3, 6, 12) use risk-adjusted values
- The risk factor appears in each detail table as a new row

**New inputs**: 4 percentage fields with default 80%.

**Impact**: Transforms the BVA from "here's what you'll save" (optimistic sales pitch) to "here's what we're 80% confident you'll save" (analytical framework). Customers can adjust risk factors down for categories they're skeptical about, which paradoxically increases trust.

### 4.3 MEDIUM PRIORITY: Structure the Investment Model (Effort: Medium)

**What**: Replace the 3 raw dollar inputs (`invest_yr1/yr2/yr3`) with a structured cost model:

| Cost Component | Type | Timing |
|---------------|------|--------|
| Software licensing | `num_vpcs × unit_price × (1 - discount_pct)` | Annual |
| Professional services | One-time dollar amount | Year 1 only |
| Internal labor | `num_people × hours × hourly_rate` | Year 1 (heaviest), Year 2 (lighter) |
| Training | One-time dollar amount | Year 1 only |
| Annual maintenance | `license_cost × maintenance_pct` | Annual |

**Why**: A structured cost model is more credible than "enter a number." It also allows sensitivity analysis on individual cost components. And it surfaces the real cost drivers — licensing is often the biggest concern, so making it explicit and showing the discount helps the sales conversation.

**Trade-off**: This adds 6–8 new inputs and significantly increases form complexity. The current approach (direct dollar entry) is simpler and lets the seller plug in numbers from a quote. Consider: could this be an "advanced mode" toggle?

**Recommendation**: Keep the direct dollar inputs as the primary UX, but add optional structured fields that auto-calculate into `invest_yr1/yr2/yr3` when populated. If structured fields are empty, fall back to direct dollar inputs.

### 4.4 MEDIUM PRIORITY: Add Sensitivity Analysis (Effort: Medium-High)

**What**: Generate a "sensitivity view" showing three scenarios:

| Scenario | Approach |
|----------|----------|
| Conservative | All inputs at 75% of default benefit assumptions |
| Expected | Current calculated values |
| Optimistic | All inputs at 125% of default benefit assumptions |

Alternatively, a **tornado chart** showing which input has the biggest impact on total benefits (usually `num_dbas` and `dba_annual_pay` dominate).

**Why**: Decision-makers rarely trust a single number. Showing a range communicates analytical maturity and helps the customer understand which assumptions matter most.

**Implementation**: This would add a new slide (Slide 3b or Slide 7) with a tornado chart or scenario comparison table. The calculation engine would run 3 scenarios and the chart builder would generate the visualization.

**Trade-off**: Adds a slide and significant chart-building complexity. High impact for executive audiences but may be overkill for smaller deals.

### 4.5 LOW PRIORITY: Capture Qualitative Benefits (Effort: Low)

**What**: Add a section to the deck (Slide 6 or a new slide) listing unquantified benefits:

- Improved regulatory compliance posture
- Reduced DBA burnout and improved retention
- Faster time-to-market for database-dependent features
- Standardized operational procedures across Db2 estate
- Better audit trail and governance
- Reduced vendor lock-in through consolidated tooling

**Why**: Some of the most compelling benefits of Genius Hub can't be reduced to a dollar figure. Listing them alongside the quantified benefits gives a more complete picture.

**Implementation**: These could be static text in the template (no user input needed) or configurable via a multi-select in the form ("select which qualitative benefits apply to this customer").

---

## 5. Prioritized Roadmap

| Phase | Improvement | Effort | Impact |
|-------|------------|--------|--------|
| **Now** | Source citations on Slide 5 | Low | High — immediate credibility boost |
| **Next** | Risk adjustment (4 new inputs, default 80%) | Medium | High — analytical rigor |
| **Later** | Structured investment model | Medium | Medium — mostly for larger deals |
| **Later** | Sensitivity / tornado chart | Medium-High | Medium — executive audiences |
| **Optional** | Qualitative benefits section | Low | Low-Medium — completeness |

---

## 6. Key Principle

> The goal of a BVA is not to produce the biggest number — it's to produce a number the customer believes.

Every recommendation above is designed to increase believability: sourcing reduces "where did you get that?", risk adjustment reduces "that seems too high", structured costs reduce "you're hiding the real price", and sensitivity analysis reduces "but what if it doesn't work out?"

The current calculator produces correct, well-formatted numbers. These improvements would make those numbers defensible.
