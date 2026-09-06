"""Profit Estimator & Season Budgeting Tool.
Calculates input costs vs expected revenues, giving net margins and break-even yields.
"""
from backend.app.models.schemas import ProfitEstimatorRequest, ProfitBudgetPlan
from backend.app.data.datasets import CROPS_CATALOG, FERTILIZER_PRICES_PKR


def run_profit_estimator(req: ProfitEstimatorRequest) -> ProfitBudgetPlan:
    crop_clean = req.crop.strip().lower()
    crop_info = CROPS_CATALOG.get("wheat")

    for key, val in CROPS_CATALOG.items():
        if key in crop_clean or crop_clean in key:
            crop_info = val
            break

    acres = req.acres
    yield_per_acre = req.expected_maunds_per_acre or crop_info["avg_yield_maunds_per_acre"]
    price_per_maund = req.selling_price_per_maund or crop_info["market_price_per_maund"]

    # Costs per acre
    seed_cost = int(crop_info["seed_cost_per_acre"] * acres)
    land_prep = int(crop_info["land_prep_cost_per_acre"] * acres)
    harvesting = int(crop_info["harvesting_cost_per_acre"] * acres)

    # Fertilizer
    urea_cost = int(crop_info["recommended_urea_bags"] * FERTILIZER_PRICES_PKR["urea"] * acres)
    dap_cost = int(crop_info["recommended_dap_bags"] * FERTILIZER_PRICES_PKR["dap"] * acres)
    sop_cost = int(crop_info["recommended_sop_bags"] * FERTILIZER_PRICES_PKR["sop"] * acres)
    fertilizer_cost = urea_cost + dap_cost + sop_cost

    pesticide_cost = int(8500 * acres)
    irrigation_diesel = int(12000 * acres)

    total_cost = seed_cost + land_prep + fertilizer_cost + pesticide_cost + irrigation_diesel + harvesting
    total_yield = yield_per_acre * acres
    gross_revenue = int(total_yield * price_per_maund)
    net_margin = gross_revenue - total_cost

    roi = round((net_margin / total_cost) * 100, 1) if total_cost > 0 else 0.0
    break_even_yield = round(total_cost / (price_per_maund * acres), 1) if (price_per_maund * acres) > 0 else 0.0

    return ProfitBudgetPlan(
        crop=crop_info["name"],
        acres=acres,
        seed_cost_pkr=seed_cost,
        land_prep_cost_pkr=land_prep,
        fertilizer_cost_pkr=fertilizer_cost,
        pesticide_spray_cost_pkr=pesticide_cost,
        irrigation_diesel_electricity_pkr=irrigation_diesel,
        harvesting_cost_pkr=harvesting,
        total_input_cost_pkr=total_cost,
        total_expected_yield_maunds=round(total_yield, 1),
        expected_gross_revenue_pkr=gross_revenue,
        net_margin_pkr=net_margin,
        return_on_investment_percent=roi,
        break_even_yield_maunds_per_acre=break_even_yield,
    )
