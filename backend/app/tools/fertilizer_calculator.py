"""Fertilizer Calculator Tool.
Computes per-acre NPK need and converts it into bags of Urea, DAP, and SOP with total cost in PKR.
100% deterministic, agronomy-backed, non-LLM calculation.
"""
from backend.app.models.schemas import FertilizerRequest, FertilizerInput, FertilizerPlan
from backend.app.services.fertilizer_service import FertilizerService


def run_fertilizer_calculator(req: FertilizerRequest) -> FertilizerPlan:
    """Delegates to the deterministic FertilizerService."""
    inp = FertilizerInput(
        crop=req.crop,
        acres=req.acres,
        soil_type=req.soil_type or "Loam (Mera)",
        target_yield=req.target_yield
    )
    return FertilizerService.calculate(inp)
