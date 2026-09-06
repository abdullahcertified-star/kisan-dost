"""Mandi Price Lookup Tool.
Retrieves official wholesale prices in Pakistani mandis (AMIS Punjab benchmarks).
"""
from typing import List
from backend.app.models.schemas import MandiPriceRequest, MandiPriceReport, MandiRateItem
from backend.app.data.datasets import MANDI_PRICES


def run_mandi_lookup(req: MandiPriceRequest) -> MandiPriceReport:
    comm_clean = req.commodity.strip().lower()
    selected_key = "wheat"

    for key in MANDI_PRICES.keys():
        if key in comm_clean or comm_clean in key:
            selected_key = key
            break

    market_data = MANDI_PRICES[selected_key]
    items: List[MandiRateItem] = []

    preferred = (req.preferred_mandi or "").strip().lower()

    for mandi_name, vals in market_data.items():
        if preferred and preferred not in mandi_name.lower():
            continue
        items.append(
            MandiRateItem(
                mandi_name=mandi_name,
                commodity=selected_key.title(),
                min_price_pkr=vals["min"],
                max_price_pkr=vals["max"],
                avg_price_pkr=vals["avg"],
                arrival_maunds=vals["arrival_maunds"],
            )
        )

    if not items:  # If preferred mandi wasn't found, return all
        for mandi_name, vals in market_data.items():
            items.append(
                MandiRateItem(
                    mandi_name=mandi_name,
                    commodity=selected_key.title(),
                    min_price_pkr=vals["min"],
                    max_price_pkr=vals["max"],
                    avg_price_pkr=vals["avg"],
                    arrival_maunds=vals["arrival_maunds"],
                )
            )

    highest_market = max(items, key=lambda x: x.avg_price_pkr)
    advice = (
        f"Top selling price currently in {highest_market.mandi_name} Mandi at PKR {highest_market.avg_price_pkr}/maund. "
        "Hold produce if current mandi arrivals are flooding or sell when arrivals taper off mid-week."
    )

    return MandiPriceReport(
        commodity=selected_key.title(),
        rates=items,
        market_trend="Stable with upward momentum on dry quality lots",
        best_market_advice=advice,
    )
