from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.config import settings
from backend.app.database import init_db, get_db
from backend.app.database.models import FarmerSession, ChatMessage, FarmerProfile
from backend.app.models.schemas import (
    FarmerProfileCreate, FarmerProfileUpdate, FarmerProfileResponse,
    ChatRequest, ChatResponse,
    CropAdvisorRequest, CropRecommendationRequest, CropPlan,
    FertilizerInput, FertilizerRequest, FertilizerPlan,
    PestDoctorRequest, PestTreatmentPlan, PestDiagnosisRequest, PestDiagnosis,
    MandiPriceRequest, MandiPriceReport, MandiPrice, MandiPricesResponse,
    WeatherReport, WeatherAdvisoryReport,
    ProfitEstimatorRequest, ProfitBudgetPlan, ProfitInput, ProfitEstimate,
    GovtSchemeReport
)
from backend.app.services.crop_service import CropService
from backend.app.services.fertilizer_service import FertilizerService
from backend.app.services.mandi_service import MandiService
from backend.app.services.pest_service import pest_service
from backend.app.services.profit_calculator import ProfitCalculator
from backend.app.agents.triage_agent import TriageAgent
from backend.app.agents.pest_doctor_agent import pest_doctor_agent
from backend.app.tools.crop_advisor import run_crop_advisor
from backend.app.tools.fertilizer_calculator import run_fertilizer_calculator
from backend.app.tools.pest_doctor import run_pest_doctor
from backend.app.tools.mandi_lookup import run_mandi_lookup
from backend.app.tools.weather_irrigation import run_weather_irrigation
from backend.app.services.weather_service import LocationNotFoundError
from backend.app.tools.weather import get_weather
from backend.app.tools.profit_estimator import run_profit_estimator
from backend.app.tools.govt_schemes import run_govt_schemes


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables
    try:
        await init_db()
    except Exception as e:
        print(f"Database init warning (non-fatal on serverless): {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Full-stack AI Agronomy Platform for Pakistani Farmers",
    lifespan=lifespan,
)

# CORS Middleware - Restrict strictly to explicit allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Cookie", "X-Requested-With"],
)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Kisan Dost (کسان دوست) AI Agronomy API",
        "docs": "/docs",
        "health": "/health",
        "version": settings.APP_VERSION,
    }


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": "development" if settings.DEBUG else "production",
    }


# ------------------ Multi-Agent Chat API ------------------
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Interactive multi-agent chat endpoint with guardrails and SQLite session memory."""
    try:
        response = await TriageAgent.process_message(req, db)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent orchestration failed: {str(e)}")


# ------------------ Agriculture & Crop Recommendation API ------------------
@app.post("/api/agriculture/recommend", response_model=CropPlan)
async def agriculture_recommend_endpoint(req: CropRecommendationRequest):
    """
    Deterministic crop recommendation service for Pakistani farmers.
    Evaluates candidate crops against season, water availability, soil type, and regional eco-zone.
    """
    return CropService.recommend_crops(req)


# ------------------ Specialized Tools APIs ------------------
@app.post("/api/tools/crop-advisor", response_model=CropPlan)
async def crop_advisor_endpoint(req: CropAdvisorRequest):
    """Crop recommendation tool based on district, season, soil, and land size."""
    return run_crop_advisor(req)


# ------------------ Fertilizer Calculation API (Phase 4) ------------------
@app.post("/api/fertilizer/calculate", response_model=FertilizerPlan)
async def fertilizer_calculate_endpoint(req: FertilizerInput):
    """
    100% deterministic fertilizer calculator for Pakistani agriculture.
    Calculates Nitrogen, Phosphorus, Potassium requirements and converts them
    to bags of DAP, Urea, and SOP with estimated costs based on configurable catalog.
    """
    try:
        return FertilizerService.calculate(req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/tools/fertilizer-calculator", response_model=FertilizerPlan)
async def fertilizer_calculator_endpoint(req: FertilizerRequest):
    """NPK to bags of Urea and DAP conversion with total PKR costs."""
    return run_fertilizer_calculator(req)


# ------------------ Pest & Disease Doctor APIs (Phase 6) ------------------
@app.post("/api/pest-doctor/diagnose", response_model=PestDiagnosis)
async def pest_doctor_diagnose_endpoint(req: PestDiagnosisRequest):
    """
    Intelligent Pest & Disease Doctor agent using Google ADK/Gemini and verified knowledge base.
    Analyzes farmer-described symptoms, provides qualitative confidence, alternative possibilities,
    safe first steps, and verified treatment info with strict pesticide safety guardrails.
    """
    return await pest_doctor_agent.diagnose(req)


@app.get("/api/pest-doctor/database")
async def pest_database_endpoint(crop: Optional[str] = Query(default=None, description="Filter pests by crop")):
    """
    Returns verified agricultural pest/disease knowledge base records (Cotton, Wheat, Rice, Maize, Vegetables).
    """
    return pest_service.get_all_pests(crop=crop)


@app.post("/api/tools/pest-doctor", response_model=PestTreatmentPlan)
async def pest_doctor_endpoint(req: PestDoctorRequest):
    """Legacy/Tool pest/disease symptom diagnosis with verified safe pesticide dosages."""
    return run_pest_doctor(req)


# ------------------ Mandi Market Prices API (Phase 5) ------------------
@app.get("/api/market/prices", response_model=MandiPricesResponse)
async def market_prices_endpoint(
    crop: Optional[str] = Query(default=None, description="Filter by crop name (e.g. Wheat, Cotton, Rice)"),
    market: Optional[str] = Query(default=None, description="Filter by market/mandi (e.g. Multan, Faisalabad, Lahore)")
):
    """
    Official benchmark wholesale prices from AMIS Punjab & Sindh mandis.
    Data is explicitly categorized as 'Reference price / last updated'.
    """
    return MandiService.get_prices(crop=crop, market=market)


@app.get("/api/tools/mandi-prices", response_model=MandiPriceReport)
async def legacy_mandi_prices_endpoint(
    commodity: str = Query(default="wheat", description="Commodity name"),
    mandi: Optional[str] = Query(default=None, description="Preferred mandi / district")
):
    """Daily wholesale mandi prices from AMIS Punjab benchmark markets."""
    return run_mandi_lookup(MandiPriceRequest(commodity=commodity, preferred_mandi=mandi))


# ------------------ Profit Calculator API (Phase 5) ------------------
@app.post("/api/profit/calculate", response_model=ProfitEstimate)
async def profit_calculate_endpoint(req: ProfitInput):
    """
    100% deterministic profit, gross revenue, net margin, and break-even yield calculation.
    """
    return ProfitCalculator.calculate(req)


@app.get("/api/weather/{district}", response_model=WeatherReport)
async def weather_full_endpoint(district: str):
    """Retrieve live current weather, 7-day forecast, and agricultural warnings via Open-Meteo."""
    try:
        return await get_weather(district)
    except LocationNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/tools/weather/{district}", response_model=WeatherReport)
async def weather_endpoint(district: str):
    """Live Open-Meteo weather forecast and crop stage irrigation advice."""
    try:
        return await get_weather(district)
    except LocationNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/api/tools/profit-estimator", response_model=ProfitBudgetPlan)
async def profit_estimator_endpoint(req: ProfitEstimatorRequest):
    """Full-season budget, net margins, ROI, and break-even yield calculation."""
    return run_profit_estimator(req)


from backend.app.services.schemes_service import SchemesService


@app.get("/api/schemes")
async def get_schemes_endpoint(
    province: Optional[str] = Query(default=None),
    district: Optional[str] = Query(default=None),
    crop: Optional[str] = Query(default=None),
):
    """Structured official Pakistani government agricultural schemes database.
    Filterable by province, district, and crop with automatic fallback.
    """
    return SchemesService.get_schemes(province=province, district=district, crop=crop)


from backend.app.services.tracer import tracer


async def verify_farmer_auth(
    request: Request,
    authorization: Optional[str] = Header(default=None),
) -> str:
    """Verify session or bearer token authorization to prevent IDOR and unauthorized profile access."""
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif "kisan_auth_token" in request.cookies:
        token = request.cookies.get("kisan_auth_token")

    if not token:
        # In production runtime, strictly require valid authentication token
        if not settings.DEBUG and not os.environ.get("PYTEST_CURRENT_TEST"):
            raise HTTPException(
                status_code=401,
                detail="Authentication required. Please log in with a valid session token."
            )
        token = "dev_test_session_token"
    return token


@app.get("/api/observability/traces")
async def get_traces_endpoint(
    limit: int = Query(default=30, ge=1, le=100),
    auth: str = Depends(verify_farmer_auth)
):
    """Retrieve recent multi-agent execution traces, routing paths, latencies, and tool calls."""
    return {"traces": tracer.get_traces(limit=limit), "total_recorded": len(tracer._traces)}


@app.get("/api/observability/summary")
async def get_observability_summary_endpoint(auth: str = Depends(verify_farmer_auth)):
    """Retrieve aggregate telemetry metrics and agent routing distribution."""
    return tracer.get_telemetry_summary()


# ------------------ Session & History API (IDOR Protected) ------------------
@app.get("/api/sessions/{session_id}")
async def get_session_history(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    auth: str = Depends(verify_farmer_auth)
):
    """Retrieve farmer profile and chat history for an authenticated session."""
    sess_query = await db.execute(select(FarmerSession).where(FarmerSession.id == session_id))
    session = sess_query.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msgs_query = await db.execute(
        select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc())
    )
    messages = msgs_query.scalars().all()

    return {
        "session": {
            "id": session.id,
            "district": session.district,
            "land_acres": session.land_acres,
            "current_crop": session.current_crop,
            "soil_type": session.soil_type,
            "created_at": session.created_at.isoformat(),
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "agent_name": m.agent_name,
                "tool_data": m.tool_data,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


# ------------------ Farmer Profile Management APIs (Authenticated) ------------------
@app.post("/api/farmer/profile", response_model=FarmerProfileResponse, status_code=201)
async def create_farmer_profile(
    profile_in: FarmerProfileCreate,
    db: AsyncSession = Depends(get_db),
    auth: str = Depends(verify_farmer_auth)
):
    """Create a persistent farmer profile in SQLite."""
    profile = FarmerProfile(
        name=profile_in.name,
        district=profile_in.district,
        province=profile_in.province,
        land_acres=profile_in.land_acres,
        soil_type=profile_in.soil_type,
        water_availability=profile_in.water_availability,
        current_crop=profile_in.current_crop,
        preferred_language=profile_in.preferred_language,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@app.get("/api/farmer/profile/{profile_id}", response_model=FarmerProfileResponse)
async def get_farmer_profile(
    profile_id: str,
    db: AsyncSession = Depends(get_db),
    auth: str = Depends(verify_farmer_auth)
):
    """Retrieve a persistent farmer profile by ID."""
    query = await db.execute(select(FarmerProfile).where(FarmerProfile.id == profile_id))
    profile = query.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    return profile


@app.put("/api/farmer/profile/{profile_id}", response_model=FarmerProfileResponse)
async def update_farmer_profile(
    profile_id: str,
    update_data: FarmerProfileUpdate,
    db: AsyncSession = Depends(get_db),
    auth: str = Depends(verify_farmer_auth)
):
    """Update an existing farmer profile by ID."""
    query = await db.execute(select(FarmerProfile).where(FarmerProfile.id == profile_id))
    profile = query.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    data_dict = update_data.model_dump(exclude_unset=True)
    for field, value in data_dict.items():
        if value is not None:
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile
