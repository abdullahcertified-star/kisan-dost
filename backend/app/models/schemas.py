from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


# ------------------ Farmer Profile Schemas ------------------
SUPPORTED_PROVINCES = [
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "KPK", "Balochistan",
    "Gilgit-Baltistan", "Azad Jammu and Kashmir", "AJK", "Islamabad"
]

SUPPORTED_WATER_SOURCES = [
    "Canal", "Tubewell", "Tube Well", "Canal + Tubewell", "Canal + Tube Well",
    "Rainfed / Barani", "Drip / Sprinkler", "Limited", "Adequate", "Abundant", "Rainfed", "Barani"
]

SUPPORTED_LANGUAGES = [
    "urdu", "roman_urdu", "english", "punjabi", "sindhi", "pashto"
]


class FarmerProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Farmer name")
    district: str = Field(..., min_length=2, max_length=100, description="District name")
    province: str = Field(..., description="Province in Pakistan")
    land_acres: float = Field(..., gt=0.0, description="Cultivated land in acres (must be > 0)")
    soil_type: str = Field(..., min_length=2, max_length=100, description="Soil classification")
    water_availability: str = Field(..., description="Primary water source")
    current_crop: str = Field(..., min_length=2, max_length=100, description="Current primary crop")
    preferred_language: str = Field(default="urdu", description="Preferred language")

    @field_validator("land_acres")
    @classmethod
    def validate_land_acres(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("land_acres must be strictly greater than 0")
        return round(v, 2)

    @field_validator("province")
    @classmethod
    def validate_province(cls, v: str) -> str:
        clean = v.strip()
        matched = [p for p in SUPPORTED_PROVINCES if p.lower() == clean.lower()]
        if not matched:
            raise ValueError(f"Unsupported province '{v}'. Must be one of: {', '.join(SUPPORTED_PROVINCES)}")
        return matched[0]

    @field_validator("water_availability")
    @classmethod
    def validate_water_availability(cls, v: str) -> str:
        clean = v.strip()
        matched = [w for w in SUPPORTED_WATER_SOURCES if w.lower() == clean.lower()]
        if not matched:
            raise ValueError(f"Unsupported water_availability '{v}'. Must be one of: {', '.join(SUPPORTED_WATER_SOURCES)}")
        return matched[0]

    @field_validator("preferred_language")
    @classmethod
    def validate_preferred_language(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean not in [lang.lower() for lang in SUPPORTED_LANGUAGES]:
            raise ValueError(f"Unsupported preferred_language '{v}'. Must be one of: {', '.join(SUPPORTED_LANGUAGES)}")
        return clean


class FarmerProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    district: Optional[str] = Field(None, min_length=2, max_length=100)
    province: Optional[str] = None
    land_acres: Optional[float] = Field(None, gt=0.0)
    soil_type: Optional[str] = Field(None, min_length=2, max_length=100)
    water_availability: Optional[str] = None
    current_crop: Optional[str] = Field(None, min_length=2, max_length=100)
    preferred_language: Optional[str] = None

    @field_validator("land_acres")
    @classmethod
    def validate_land_acres(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("land_acres must be strictly greater than 0")
        return round(v, 2) if v is not None else None

    @field_validator("province")
    @classmethod
    def validate_province(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        matched = [p for p in SUPPORTED_PROVINCES if p.lower() == clean.lower()]
        if not matched:
            raise ValueError(f"Unsupported province '{v}'. Must be one of: {', '.join(SUPPORTED_PROVINCES)}")
        return matched[0]

    @field_validator("water_availability")
    @classmethod
    def validate_water_availability(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip()
        matched = [w for w in SUPPORTED_WATER_SOURCES if w.lower() == clean.lower()]
        if not matched:
            raise ValueError(f"Unsupported water_availability '{v}'. Must be one of: {', '.join(SUPPORTED_WATER_SOURCES)}")
        return matched[0]

    @field_validator("preferred_language")
    @classmethod
    def validate_preferred_language(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        clean = v.strip().lower()
        if clean not in [lang.lower() for lang in SUPPORTED_LANGUAGES]:
            raise ValueError(f"Unsupported preferred_language '{v}'. Must be one of: {', '.join(SUPPORTED_LANGUAGES)}")
        return clean


class FarmerProfileResponse(BaseModel):
    id: str
    name: str
    district: str
    province: str
    land_acres: float
    soil_type: str
    water_availability: str
    current_crop: str
    preferred_language: str
    created_at: datetime
    updated_at: datetime


# ------------------ Crop Advisor ------------------
class CropRecommendationRequest(BaseModel):
    district: str = Field(default="Multan", description="Pakistani district name")
    province: Optional[str] = Field(default="Punjab", description="Province in Pakistan")
    season: str = Field(default="Rabi", description="Cropping season (Rabi or Kharif)")
    soil_type: str = Field(default="Loam (Mera)", description="Soil classification (Loam, Clay, Sandy)")
    water_availability: str = Field(default="Limited", description="Water availability: Limited, Normal, Abundant, Rainfed")
    land_acres: float = Field(default=5.0, gt=0.0, le=1000000.0, description="Cultivated land in acres")
    preferred_language: Optional[str] = Field(default="urdu", description="urdu or english")


# Backward compatibility alias
CropAdvisorRequest = CropRecommendationRequest


class CropRecommendation(BaseModel):
    crop_name: str
    crop_name_urdu: str = ""
    season: str
    suitability_score: float = Field(..., ge=0.0, le=100.0, description="Deterministic suitability score 0-100")
    suitability_label: str = Field(..., description="e.g. Highly Suitable, Suitable, Moderate")
    acreage_allocation: float = Field(..., description="Recommended acreage allocation out of total")
    water_requirement: str = Field(..., description="e.g. Low (1-2 irrigations)")
    reasons: List[str] = Field(default_factory=list, description="Agronomic justifications for recommendation")
    risks: List[str] = Field(default_factory=list, description="Agronomic risks, pest threats, and climatic watchpoints")
    expected_yield_maunds_per_acre: float
    total_expected_yield_maunds: float
    market_price_per_maund: int
    gross_revenue_pkr: int
    estimated_cost_pkr: int
    net_profit_pkr: int
    sowing_window: str = ""
    growing_duration_days: int = 120
    common_pests: List[str] = Field(default_factory=list)
    irrigation_advice: str = ""


# Alias for previous usage
CropRecommendationItem = CropRecommendation


class CropPlan(BaseModel):
    district: str
    province: str = "Punjab"
    season: str
    land_acres: float
    total_recommended_acreage: Optional[float] = None
    soil_type: str
    water_availability: str = "Normal"
    recommended_crop: str
    recommended_crop_urdu: str = ""
    recommendations: List[CropRecommendation]
    top_recommendations: Optional[List[CropRecommendation]] = None
    overall_agronomy_summary: str
    summary_urdu: Optional[str] = None
    generated_by: str = "Deterministic Agronomy Service (Kisan Dost)"


# ------------------ Fertilizer Calculator ------------------
class FertilizerInput(BaseModel):
    crop: str = Field(..., description="Crop name (e.g. Wheat, Chickpea, Mustard, Rice, Cotton, Maize, Potato)")
    acres: float = Field(..., gt=0.0, le=1000000.0, description="Cultivated land in acres")
    soil_type: str = Field(default="Loam (Mera)", description="Soil texture type (Sandy Loam, Loam, Clay Loam)")
    target_yield: Optional[float] = Field(default=None, gt=0.0, description="Optional target yield in maunds per acre")
    preferred_language: Optional[str] = Field(default="urdu", description="Preferred language (urdu or english)")

    @field_validator("crop")
    @classmethod
    def validate_crop(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Crop name cannot be empty")
        valid_keywords = [
            "wheat", "gandum", "گندم",
            "chickpea", "gram", "chana", "چنا",
            "mustard", "canola", "raya", "sarson", "سرسوں", "کینولا", "رایا",
            "rice", "paddy", "chawal", "dhan", "چاول", "دھان",
            "cotton", "kapas", "کپاس", "پھٹی",
            "maize", "corn", "makai", "makki", "مکئی",
            "potato", "aaloo", "aalu", "aloo", "آلو"
        ]
        clean = v.strip().lower()
        if not any(k in clean for k in valid_keywords):
            raise ValueError(
                f"Crop '{v}' is not supported. Supported crops are: Wheat, Chickpea, Mustard, Rice, Cotton, Maize, Potato."
            )
        return v


class FertilizerRequest(BaseModel):
    """Backwards compatible request wrapper."""
    crop: str = Field(default="wheat", description="Crop name")
    acres: float = Field(default=5.0, ge=0.1, le=1000000.0, description="Cultivated land in acres")
    soil_condition: Optional[str] = Field(default="Normal", description="Normal, Low Fertility, Saline")
    soil_type: Optional[str] = Field(default="Loam (Mera)", description="Soil texture type")
    target_yield: Optional[float] = Field(default=None, description="Optional target yield")


class FertilizerProduct(BaseModel):
    product_id: str
    product_name_en: str
    product_name_ur: str
    bag_size_kg: float = 50.0
    bags_count: float
    unit_price_pkr: int
    total_cost_pkr: int
    is_price_estimate: bool = True
    nutrients_contributed_kg: Dict[str, float]
    application_timing: str


class FertilizerPlan(BaseModel):
    crop: str
    crop_ur: str
    acres: float
    soil_type: str
    target_yield: Optional[float] = None
    benchmark_yield: float
    nitrogen_requirement_kg: float
    phosphorus_requirement_kg: float
    potassium_requirement_kg: float
    dap_bags: float
    urea_bags: float
    sop_bags: float
    urea_cost_pkr: int = 0
    dap_cost_pkr: int = 0
    sop_cost_pkr: int = 0
    total_cost_pkr: int = 0
    estimated_total_cost_pkr: int = 0
    is_price_estimate: bool = True
    price_disclaimer: str = "نرخ مارکیٹ کے تخمینہ پر مبنی ہیں اور سیزنل طلب کے مطابق تبدیل ہو سکتے ہیں۔ (Market retail estimate)"
    products: List[FertilizerProduct] = Field(default_factory=list)
    npk_kg_applied: Dict[str, float] = Field(default_factory=dict)
    application_schedule: List[str] = Field(default_factory=list)
    application_schedule_en: List[str] = Field(default_factory=list)
    application_schedule_ur: List[str] = Field(default_factory=list)
    agronomic_advice_urdu: str = ""
    agronomic_advice_english: str = ""
    safety_notice: str = "یہ منصوبہ خالصتاً غذائی عناصر (NPK) پر مبنی ہے۔ کسی غیر مصدقہ زہر یا کیمیکل کا استعمال نہ کریں۔"


# ------------------ Pest & Disease Doctor ------------------
class PestDoctorRequest(BaseModel):
    crop: Optional[str] = Field(default="cotton", description="Crop affected")
    symptoms: str = Field(..., description="Farmer's description of symptoms, e.g., 'cotton leaves curling, tiny white insects'")
    acres: Optional[float] = Field(default=5.0, ge=0.5)


class PestDiagnosisRequest(BaseModel):
    crop: Optional[str] = Field(default=None, description="Crop name (e.g. Cotton, Wheat, Rice, Maize, Vegetables)")
    symptoms: str = Field(..., description="Farmer's description of symptoms in English, Urdu, or Roman Urdu")
    district: Optional[str] = Field(default="Multan", description="Farmer district for agro-climatic context")
    acres: Optional[float] = Field(default=5.0, ge=0.1, description="Cultivated land in acres")
    image_data: Optional[str] = Field(default=None, description="Optional Base64 encoded crop image for future visual diagnosis")


class VerifiedTreatment(BaseModel):
    active_ingredient: str
    trade_names: List[str] = Field(default_factory=list)
    has_verified_dosage: bool = True
    safe_dosage_per_acre: Optional[str] = None
    dosage_numeric_ml_per_acre: Optional[float] = None
    water_volume_liters_per_acre: Optional[int] = 100
    spray_timing: Optional[str] = None
    application_instructions: Optional[str] = None
    source: str = "Punjab Agriculture Department & PARC"


class AlternativeDiagnosis(BaseModel):
    pest_name: str
    pest_name_ur: str
    scientific_name: Optional[str] = None
    likelihood: str = "Moderate"
    distinguishing_feature: str


class PestDiagnosis(BaseModel):
    crop: str
    primary_diagnosis: str
    primary_diagnosis_ur: str
    scientific_name: str
    category: str
    confidence: str = Field(description="Qualitative confidence: High, Moderate, or Tentative / Low")
    symptom_analysis: str
    risk_factors: List[str] = Field(default_factory=list)
    alternative_possibilities: List[AlternativeDiagnosis] = Field(default_factory=list)
    non_chemical_management: List[str] = Field(default_factory=list)
    verified_treatment: Optional[VerifiedTreatment] = None
    dosage_disclaimer: str = "Exact dosage must strictly be verified from the locally registered product bottle label or qualified agricultural extension officer."
    safety_notes: List[str] = Field(default_factory=list)
    phi_days: Optional[int] = 14
    is_medical_query_rejected: bool = False
    medical_rejection_notice: Optional[str] = None
    source: str = "Pakistan Agricultural Research Council (PARC) & Dept of Agriculture"
    image_supported: bool = True


class PestTreatmentPlan(BaseModel):
    pest_or_disease: str
    identified_crop: str
    matched_symptoms: List[str]
    chemical_treatment: str
    safe_dosage_ml_per_acre: float
    max_safe_limit_ml_per_acre: float
    water_liters_per_acre: int
    total_chemical_needed_ml: float
    organic_alternative: str
    safety_warning: str
    phi_days: int = Field(default=14, description="Pre-harvest interval (days to wait before harvest)")


# ------------------ Mandi Price Lookup ------------------
class MandiPrice(BaseModel):
    crop: str
    crop_ur: str = ""
    mandi_name: str
    province: str = "Punjab"
    min_price_pkr: int
    max_price_pkr: int
    avg_price_pkr: int
    arrival_maunds: int = 0
    arrival_volume_maunds: Optional[int] = None
    unit: str = "40 kg (1 Maund)"
    price_type: str = "Reference price / last updated"
    last_updated: str = "2026-09-05"
    source: str = "AMIS Punjab Agricultural Marketing Information Service (Benchmark)"


class MandiPricesResponse(BaseModel):
    commodity: Optional[str] = None
    market: Optional[str] = None
    total_records: int
    data_notice: str = "Reference price / last updated"
    disclaimer: str = (
        "All values are official benchmark reference prices from Punjab Agriculture Department (AMIS) records. "
        "Intraday auction rates vary based on arrival volumes, moisture, and grading. Stored values are not live intraday prices."
    )
    markets_available: List[str] = Field(default_factory=list)
    crops_available: List[str] = Field(default_factory=list)
    rates: List[MandiPrice]
    market_summary: Optional[str] = None


class MandiPriceRequest(BaseModel):
    commodity: str = Field(default="wheat", description="Commodity (wheat, cotton, rice, maize, mustard)")
    preferred_mandi: Optional[str] = Field(default=None, description="Specific market town or district")


class MandiRateItem(BaseModel):
    mandi_name: str
    commodity: str
    min_price_pkr: int
    max_price_pkr: int
    avg_price_pkr: int
    arrival_maunds: int


class MandiPriceReport(BaseModel):
    commodity: str
    unit: str = "40 kg (1 Maund)"
    rates: List[MandiRateItem]
    market_trend: str
    best_market_advice: str


# ------------------ Weather & 7-Day Forecast ------------------
class DailyForecastItem(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    precipitation: float
    weather_condition: str
    wind_speed_max: float
    irrigation_advice: str


class CurrentWeatherMetrics(BaseModel):
    time: Optional[str] = None
    temperature_2m: float
    apparent_temperature: float
    relative_humidity_2m: float
    precipitation: float
    wind_speed_10m: float


class WeatherReport(BaseModel):
    location: str
    district: str
    latitude: float
    longitude: float
    temperature: float
    temperature_c: Optional[float] = None
    apparent_temperature: Optional[float] = None
    humidity: float
    humidity_percent: Optional[float] = None
    wind_speed: float
    wind_speed_kmh: Optional[float] = None
    precipitation: float
    next_3_days_precipitation_mm: Optional[float] = None
    weather_condition: str
    weather_code: int
    current: Optional[CurrentWeatherMetrics] = None
    forecast: List[DailyForecastItem]
    warnings: List[str]
    irrigation_advice: str
    heatwave_risk: bool
    frost_risk: bool
    forecast_source: str
    recorded_at: Optional[str] = None


class WeatherAdvisoryReport(BaseModel):
    district: str
    temperature_c: float
    humidity_percent: float
    wind_speed_kmh: float
    next_3_days_precipitation_mm: float
    heatwave_risk: bool
    frost_risk: bool
    irrigation_advice: str
    forecast_source: str


# ------------------ Profit Estimator ------------------
class ProfitInput(BaseModel):
    crop: str = Field(default="Wheat", description="Crop name")
    acres: float = Field(default=5.0, gt=0.0, le=1000000.0, description="Cultivated land in acres")
    expected_yield_per_acre: float = Field(..., gt=0.0, description="Expected yield in maunds per acre")
    mandi_price: float = Field(..., gt=0.0, description="Mandi price per maund in PKR")
    seed_cost: float = Field(default=0.0, ge=0.0, description="Seed cost in PKR per acre")
    fertilizer_cost: float = Field(default=0.0, ge=0.0, description="Fertilizer cost in PKR per acre")
    pesticide_cost: float = Field(default=0.0, ge=0.0, description="Pesticide/spray cost in PKR per acre")
    irrigation_cost: float = Field(default=0.0, ge=0.0, description="Irrigation & fuel cost in PKR per acre")
    labor_cost: float = Field(default=0.0, ge=0.0, description="Labor cost in PKR per acre")
    other_costs: float = Field(default=0.0, ge=0.0, description="Land prep, machinery & other costs in PKR per acre")


class SensitivityScenario(BaseModel):
    scenario: str
    yield_maunds_per_acre: float
    mandi_price_pkr: float
    gross_revenue_pkr: float
    net_profit_pkr: float
    profit_per_acre_pkr: float


class ProfitEstimate(BaseModel):
    crop: str
    crop_ur: str = ""
    acres: float
    expected_yield_per_acre: float
    expected_production: float
    mandi_price: float
    gross_revenue: float
    total_cost: float
    cost_per_acre: float
    net_profit: float
    profit_per_acre: float
    break_even_yield: float
    return_on_investment_percent: float
    roi_percentage: float = 0.0
    is_profitable: bool = True
    cost_breakdown: Dict[str, float]
    sensitivity_analysis: List[SensitivityScenario] = Field(default_factory=list)


class ProfitEstimatorRequest(BaseModel):
    crop: str = Field(default="wheat")
    acres: float = Field(default=5.0, ge=0.5)
    expected_maunds_per_acre: Optional[float] = None
    selling_price_per_maund: Optional[int] = None


class ProfitBudgetPlan(BaseModel):
    crop: str
    acres: float
    seed_cost_pkr: int
    land_prep_cost_pkr: int
    fertilizer_cost_pkr: int
    pesticide_spray_cost_pkr: int
    irrigation_diesel_electricity_pkr: int
    harvesting_cost_pkr: int
    total_input_cost_pkr: int
    total_expected_yield_maunds: float
    expected_gross_revenue_pkr: int
    net_margin_pkr: int
    return_on_investment_percent: float
    break_even_yield_maunds_per_acre: float


# ------------------ Govt Support Finder ------------------
class GovtSchemeItem(BaseModel):
    title: str
    province: str
    eligibility: str
    benefit: str
    how_to_apply: str
    urgency_note: str


class GovtSchemeReport(BaseModel):
    province: str
    land_acres: float
    matched_schemes: List[GovtSchemeItem]
    recommendation_summary: str


# ------------------ Multi-Agent Chat ------------------
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str
    district: Optional[str] = "Multan"
    land_acres: Optional[float] = 5.0
    current_crop: Optional[str] = "Wheat"
    soil_type: Optional[str] = "Loam (Mera)"
    language: Optional[str] = "urdu"  # 'urdu', 'roman_urdu', 'english'
    debug: Optional[bool] = False


class ChatResponse(BaseModel):
    session_id: str
    response: str
    agent_name: str
    tool_used: Optional[str] = None
    tool_data: Optional[Dict[str, Any]] = None
    disclaimer: Optional[str] = None
    debug_trace: Optional[Dict[str, Any]] = None
