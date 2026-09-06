"""Deterministic Profit Calculator Service (Phase 5).
Computes exact farm budget, gross revenue, net margins, profit per acre,
break-even yield, and sensitivity forecasting without LLM hallucination.
"""
from typing import List, Dict
from backend.app.models.schemas import ProfitInput, ProfitEstimate, SensitivityScenario


CROP_URDU_NAMES: Dict[str, str] = {
    "wheat": "گندم",
    "cotton": "کپاس",
    "rice": "دھان / چاول",
    "maize": "مکئی",
    "mustard": "سرسوں / کینولا",
    "potato": "آلو",
    "chickpea": "چنا",
    "sugarcane": "کماد / گنا",
}


class ProfitCalculator:
    @classmethod
    def calculate(cls, inp: ProfitInput) -> ProfitEstimate:
        """
        Calculates deterministic financial and yield metrics for crop production.
        Formulae:
        - expected_production = expected_yield_per_acre * acres
        - gross_revenue = expected_production * mandi_price
        - cost_per_acre = seed + fertilizer + pesticide + irrigation + labor + other
        - total_cost = cost_per_acre * acres
        - net_profit = gross_revenue - total_cost
        - profit_per_acre = net_profit / acres
        - break_even_yield = cost_per_acre / mandi_price
        """
        acres = float(inp.acres)
        yield_per_acre = float(inp.expected_yield_per_acre)
        mandi_price = float(inp.mandi_price)

        # 1. Production & Gross Revenue
        expected_production = round(yield_per_acre * acres, 2)
        gross_revenue = round(expected_production * mandi_price, 2)

        # 2. Production Costs
        cost_per_acre = round(
            float(inp.seed_cost)
            + float(inp.fertilizer_cost)
            + float(inp.pesticide_cost)
            + float(inp.irrigation_cost)
            + float(inp.labor_cost)
            + float(inp.other_costs),
            2
        )
        total_cost = round(cost_per_acre * acres, 2)

        # 3. Margins & Break-Even
        net_profit = round(gross_revenue - total_cost, 2)
        profit_per_acre = round(net_profit / acres, 2) if acres > 0 else 0.0

        break_even_yield = (
            round(cost_per_acre / mandi_price, 2)
            if mandi_price > 0 else 0.0
        )

        roi = (
            round((net_profit / total_cost) * 100, 1)
            if total_cost > 0 else 0.0
        )

        # 4. Itemized Cost Breakdown (Total across all acres)
        cost_breakdown = {
            "seed": round(float(inp.seed_cost) * acres, 2),
            "fertilizer": round(float(inp.fertilizer_cost) * acres, 2),
            "pesticide": round(float(inp.pesticide_cost) * acres, 2),
            "irrigation": round(float(inp.irrigation_cost) * acres, 2),
            "labor": round(float(inp.labor_cost) * acres, 2),
            "other": round(float(inp.other_costs) * acres, 2),
        }

        # 5. Deterministic Sensitivity Analysis Matrix
        # Evaluates -20%, -10%, Base, +10%, +20% fluctuations
        scenarios_config = [
            ("-20% Price Drop", 1.0, 0.8),
            ("-10% Price Drop", 1.0, 0.9),
            ("Base Plan", 1.0, 1.0),
            ("+10% Market Surge", 1.0, 1.1),
            ("+20% Market Surge", 1.0, 1.2),
            ("-20% Drought/Pest Loss", 0.8, 1.0),
            ("+20% High Yield Season", 1.2, 1.0),
        ]

        sensitivity_list: List[SensitivityScenario] = []
        for name, y_factor, p_factor in scenarios_config:
            s_yield = round(yield_per_acre * y_factor, 2)
            s_price = round(mandi_price * p_factor, 2)
            s_rev = round(s_yield * acres * s_price, 2)
            s_profit = round(s_rev - total_cost, 2)
            s_ppa = round(s_profit / acres, 2)

            sensitivity_list.append(
                SensitivityScenario(
                    scenario=name,
                    yield_maunds_per_acre=s_yield,
                    mandi_price_pkr=s_price,
                    gross_revenue_pkr=s_rev,
                    net_profit_pkr=s_profit,
                    profit_per_acre_pkr=s_ppa,
                )
            )

        crop_clean = inp.crop.strip().lower()
        crop_ur = CROP_URDU_NAMES.get(crop_clean, inp.crop)

        return ProfitEstimate(
            crop=inp.crop,
            crop_ur=crop_ur,
            acres=acres,
            expected_yield_per_acre=yield_per_acre,
            expected_production=expected_production,
            mandi_price=mandi_price,
            gross_revenue=gross_revenue,
            total_cost=total_cost,
            cost_per_acre=cost_per_acre,
            net_profit=net_profit,
            profit_per_acre=profit_per_acre,
            break_even_yield=break_even_yield,
            return_on_investment_percent=roi,
            roi_percentage=roi,
            is_profitable=(net_profit >= 0),
            cost_breakdown=cost_breakdown,
            sensitivity_analysis=sensitivity_list,
        )
