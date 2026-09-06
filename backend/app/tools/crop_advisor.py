"""Crop Advisor Tool.
Recommends the best Pakistani crops with deterministic suitability scoring,
reasons, risks, and water requirement matching.
"""
from backend.app.models.schemas import CropRecommendationRequest, CropPlan
from backend.app.services.crop_service import CropService


def run_crop_advisor(req: CropRecommendationRequest) -> CropPlan:
    """Execute deterministic crop recommendation service."""
    return CropService.recommend_crops(req)
