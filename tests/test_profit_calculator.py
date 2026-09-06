import pytest
from backend.app.models.schemas import ProfitInput
from backend.app.services.profit_calculator import ProfitCalculator

def test_profit_calculator_deterministic_wheat():
    # 5 acres of wheat
    # expected yield: 40 maunds/acre -> total 200 maunds
    # mandi price: 3900 PKR/maund -> gross revenue = 200 * 3900 = 780,000 PKR
    # Costs per acre:
    # seed: 8,000
    # fertilizer: 25,000
    # pesticide: 6,000
    # irrigation: 12,000
    # labor: 10,000
    # other: 4,000
    # Total cost/acre = 65,000 PKR -> total cost for 5 acres = 325,000 PKR
    # Net profit = 780,000 - 325,000 = 455,000 PKR
    # Profit per acre = 455,000 / 5 = 91,000 PKR
    # Break-even yield per acre = 65,000 / 3900 = 16.67 maunds/acre
    inp = ProfitInput(
        crop="Wheat (گندم)",
        acres=5.0,
        expected_yield_per_acre=40.0,
        mandi_price=3900.0,
        seed_cost=8000.0,
        fertilizer_cost=25000.0,
        pesticide_cost=6000.0,
        irrigation_cost=12000.0,
        labor_cost=10000.0,
        other_costs=4000.0
    )
    
    result = ProfitCalculator.calculate(inp)
    
    assert result.expected_production == 200.0
    assert result.gross_revenue == 780000.0
    assert result.total_cost == 325000.0
    assert result.net_profit == 455000.0
    assert result.profit_per_acre == 91000.0
    assert result.break_even_yield == 16.67
    assert result.is_profitable is True
    assert result.cost_breakdown["fertilizer"] == 125000.0
    assert len(result.sensitivity_analysis) == 7

def test_profit_calculator_loss_scenario():
    # Cotton crop with severe pest loss and high pesticide cost
    # 2 acres, 8 maunds/acre = 16 maunds
    # mandi price = 7500 PKR -> gross revenue = 120,000 PKR
    # Costs:
    # seed: 15,000 * 2 = 30,000
    # fertilizer: 30,000 * 2 = 60,000
    # pesticide: 35,000 * 2 = 70,000
    # irrigation: 15,000 * 2 = 30,000
    # labor: 15,000 * 2 = 30,000
    # other: 5,000 * 2 = 10,000
    # Total cost = 230,000 PKR
    # Net profit = 120,000 - 230,000 = -110,000 PKR
    inp = ProfitInput(
        crop="Cotton (کپاس)",
        acres=2.0,
        expected_yield_per_acre=8.0,
        mandi_price=7500.0,
        seed_cost=15000.0,
        fertilizer_cost=30000.0,
        pesticide_cost=35000.0,
        irrigation_cost=15000.0,
        labor_cost=15000.0,
        other_costs=5000.0
    )
    
    result = ProfitCalculator.calculate(inp)
    
    assert result.expected_production == 16.0
    assert result.gross_revenue == 120000.0
    assert result.total_cost == 230000.0
    assert result.net_profit == -110000.0
    assert result.profit_per_acre == -55000.0
    assert result.is_profitable is False
    assert result.roi_percentage < 0

def test_profit_calculator_zero_costs():
    inp = ProfitInput(
        crop="Maize (مکئی)",
        acres=1.0,
        expected_yield_per_acre=80.0,
        mandi_price=2600.0,
        seed_cost=0.0,
        fertilizer_cost=0.0,
        pesticide_cost=0.0,
        irrigation_cost=0.0,
        labor_cost=0.0,
        other_costs=0.0
    )
    result = ProfitCalculator.calculate(inp)
    assert result.expected_production == 80.0
    assert result.gross_revenue == 208000.0
    assert result.total_cost == 0.0
    assert result.net_profit == 208000.0
    assert result.break_even_yield == 0.0

def test_api_profit_calculate():
    from fastapi.testclient import TestClient
    from backend.app.main import app
    client = TestClient(app)
    payload = {
        "crop": "Wheat",
        "acres": 10.0,
        "expected_yield_per_acre": 35.0,
        "mandi_price": 3900.0,
        "seed_cost": 7500.0,
        "fertilizer_cost": 22000.0,
        "pesticide_cost": 5000.0,
        "irrigation_cost": 10000.0,
        "labor_cost": 8000.0,
        "other_costs": 3000.0
    }
    resp = client.post("/api/profit/calculate", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["crop"] == "Wheat"
    assert data["acres"] == 10.0
    assert data["expected_production"] == 350.0
    assert data["gross_revenue"] == 350.0 * 3900.0
    assert data["break_even_yield"] > 0
    assert "cost_breakdown" in data
    assert "sensitivity_analysis" in data

