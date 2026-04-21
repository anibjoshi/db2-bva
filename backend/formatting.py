def fmt_currency_full(value: float) -> str:
    """$2,616,300"""
    return f"${value:,.0f}"


def fmt_currency_short(value: float) -> str:
    """$2.62M / $712K / $285"""
    abs_val = abs(value)
    if abs_val >= 1_000_000:
        # Format to 2 decimals, then strip trailing zeros and decimal point
        num = f"{value / 1e6:.2f}"
        num = num.rstrip("0").rstrip(".")
        return f"${num}M"
    elif abs_val >= 1_000:
        return f"${round(value / 1e3):.0f}K"
    else:
        return f"${value:.0f}"


def fmt_percentage(value: float) -> str:
    """0.85 → '85%', 0.10 → '10%'"""
    pct = value * 100
    if pct == int(pct):
        return f"{int(pct)}%"
    return f"{pct:.1f}%"


def fmt_roi(value: float) -> str:
    """ROI percentage: 0.0%, 150.3%"""
    return f"{value:.1f}%"


def fmt_investment_cell(value: float) -> str:
    """$X,XXX or '---' when 0"""
    return "---" if value == 0 else fmt_currency_full(value)
