import pytest
from backend.app.models.schemas import (
    CropAdvisorRequest, FertilizerRequest, PestDoctorRequest,
    MandiPriceRequest, ProfitEstimatorRequest
)
from backend.app.tools.crop_advisor import run_crop_advisor
from backend.app.tools.fertilizer_calculator import run_fertilizer_calculator
from backend.app.tools.pest_doctor import run_pest_doctor
from backend.app.tools.mandi_lookup import run_mandi_lookup
from backend.app.tools.profit_estimator import run_profit_estimator
from backend.app.tools.govt_schemes import run_govt_schemes


def test_crop_advisor():
    req = CropAdvisorRequest(district="Multan", soil_type="Loam", season="Rabi", land_acres=5.0)
    plan = run_crop_advisor(req)
    assert plan.district == "Multan"
    assert len(plan.top_recommendations) > 0
    top = plan.top_recommendations[0]
    assert top.net_profit_pkr > 0
    assert top.expected_yield_maunds_per_acre > 0


def test_fertilizer_calculator():
    req = FertilizerRequest(crop="wheat", acres=10.0)
    plan = run_fertilizer_calculator(req)
    assert plan.urea_bags == 15.8  # Net nitrogen after DAP contribution
    assert plan.dap_bags == 15.2
    assert plan.total_cost_pkr > 0
    assert len(plan.application_schedule) >= 2


def test_pest_doctor_whitefly():
    req = PestDoctorRequest(crop="cotton", symptoms="cotton leaves curling, tiny white insects", acres=5.0)
    plan = run_pest_doctor(req)
    assert "Whitefly" in plan.pest_or_disease
    assert plan.safe_dosage_ml_per_acre <= plan.max_safe_limit_ml_per_acre
    assert plan.water_liters_per_acre >= 100


def test_mandi_lookup():
    req = MandiPriceRequest(commodity="wheat")
    report = run_mandi_lookup(req)
    assert len(report.rates) > 0
    assert report.rates[0].avg_price_pkr > 3000


def test_profit_estimator():
    req = ProfitEstimatorRequest(crop="wheat", acres=5.0)
    plan = run_profit_estimator(req)
    assert plan.total_input_cost_pkr > 0
    assert plan.expected_gross_revenue_pkr > plan.total_input_cost_pkr
    assert plan.break_even_yield_maunds_per_acre > 0


def test_govt_schemes():
    report = run_govt_schemes(province="Punjab", land_acres=5.0)
    assert len(report.matched_schemes) >= 3
    assert any("Kisan Card" in s.title for s in report.matched_schemes)
