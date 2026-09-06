/**
 * Core domain types for Kisan Dost
 */

export interface FarmerProfile {
  id?: string;
  name?: string;
  district: string;
  tehsil?: string;
  land_acres: number;
  current_crop?: string;
  soil_type?: string;
  water_source?: string;
  preferred_language?: 'urdu' | 'roman_urdu' | 'english';
}

export interface CropRecommendation {
  crop_name: string;
  crop_name_urdu: string;
  season: string;
  suitability_score: number;
  suitability_label: string;
  acreage_allocation: number;
  water_requirement: string;
  reasons: string[];
  risks: string[];
  expected_yield_maunds_per_acre: number;
  total_expected_yield_maunds: number;
  market_price_per_maund: number;
  gross_revenue_pkr: number;
  estimated_cost_pkr: number;
  net_profit_pkr: number;
  sowing_window?: string;
  growing_duration_days?: number;
  common_pests?: string[];
  irrigation_advice?: string;
}

export interface CropPlan {
  district: string;
  province: string;
  season: string;
  land_acres: number;
  soil_type: string;
  water_availability: string;
  recommended_crop: string;
  recommended_crop_urdu: string;
  recommendations: CropRecommendation[];
  top_recommendations?: CropRecommendation[];
  overall_agronomy_summary: string;
  summary_urdu?: string;
  generated_by?: string;
}

export interface CropRecommendationRequest {
  district: string;
  province?: string;
  season: string;
  soil_type: string;
  water_availability: string;
  land_acres: number;
  preferred_language?: string;
}

export interface DailyForecastItem {
  date: string;
  temperature_max: number;
  temperature_min: number;
  precipitation: number;
  weather_condition: string;
  wind_speed_max: number;
  irrigation_advice: string;
}

export interface CurrentWeatherMetrics {
  time?: string;
  temperature_2m: number;
  apparent_temperature: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
}

export interface WeatherReport {
  location: string;
  district: string;
  latitude: number;
  longitude: number;
  temperature: number;
  apparent_temperature?: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
  weather_condition: string;
  weather_code: number;
  current?: CurrentWeatherMetrics;
  forecast: DailyForecastItem[];
  warnings: string[];
  irrigation_advice: string;
  heatwave_risk: boolean;
  frost_risk: boolean;
  forecast_source: string;
  recorded_at?: string;
}

export interface FertilizerProduct {
  product_id: string;
  product_name_en: string;
  product_name_ur: string;
  bag_size_kg: number;
  bags_count: number;
  unit_price_pkr: number;
  total_cost_pkr: number;
  is_price_estimate: boolean;
  nutrients_contributed_kg: {
    N: number;
    P: number;
    K: number;
  };
  application_timing: string;
}

export interface FertilizerPlan {
  crop: string;
  crop_ur: string;
  acres: number;
  soil_type: string;
  target_yield?: number | null;
  benchmark_yield: number;
  nitrogen_requirement_kg: number;
  phosphorus_requirement_kg: number;
  potassium_requirement_kg: number;
  dap_bags: number;
  urea_bags: number;
  sop_bags: number;
  urea_cost_pkr: number;
  dap_cost_pkr: number;
  sop_cost_pkr: number;
  total_cost_pkr: number;
  estimated_total_cost_pkr: number;
  is_price_estimate: boolean;
  price_disclaimer: string;
  products: FertilizerProduct[];
  npk_kg_applied: { [key: string]: number };
  application_schedule: string[];
  application_schedule_en?: string[];
  application_schedule_ur?: string[];
  agronomic_advice_urdu: string;
  agronomic_advice_english: string;
  safety_notice: string;
}

export interface FertilizerInput {
  crop: string;
  acres: number;
  soil_type: string;
  target_yield?: number | null;
  preferred_language?: string;
}

export interface MandiPrice {
  crop: string;
  crop_ur: string;
  mandi_name: string;
  province: string;
  min_price_pkr: number;
  max_price_pkr: number;
  avg_price_pkr: number;
  unit: string;
  reference_date: string;
  price_type: string;
  data_source: string;
  arrival_maunds?: number;
  arrival_volume_maunds?: number | null;
}

export interface MandiPricesResponse {
  total_records: number;
  data_notice: string;
  last_database_update: string;
  markets_available: string[];
  crops_available: string[];
  rates: MandiPrice[];
}

export interface ProfitInput {
  crop: string;
  acres: number;
  expected_yield_per_acre: number;
  mandi_price: number;
  seed_cost: number;
  fertilizer_cost: number;
  pesticide_cost: number;
  irrigation_cost: number;
  labor_cost: number;
  other_costs: number;
}

export interface SensitivityScenario {
  scenario: string;
  yield_maunds_per_acre: number;
  mandi_price_pkr: number;
  gross_revenue_pkr: number;
  net_profit_pkr: number;
  profit_per_acre_pkr: number;
}

export interface ProfitEstimate {
  crop: string;
  crop_ur: string;
  acres: number;
  expected_yield_per_acre: number;
  expected_production: number;
  mandi_price: number;
  gross_revenue: number;
  total_cost: number;
  cost_per_acre: number;
  net_profit: number;
  profit_per_acre: number;
  break_even_yield: number;
  return_on_investment_percent: number;
  roi_percentage: number;
  is_profitable: boolean;
  cost_breakdown: {
    seed: number;
    fertilizer: number;
    pesticide: number;
    irrigation: number;
    labor: number;
    other: number;
    [key: string]: number;
  };
  sensitivity_analysis: SensitivityScenario[];
}

export interface VerifiedTreatment {
  active_ingredient: string;
  trade_names: string[];
  has_verified_dosage: boolean;
  safe_dosage_per_acre?: string | null;
  dosage_numeric_ml_per_acre?: number | null;
  water_volume_liters_per_acre?: number;
  spray_timing?: string | null;
  application_instructions?: string | null;
  source: string;
}

export interface AlternativeDiagnosis {
  pest_name: string;
  pest_name_ur: string;
  scientific_name?: string | null;
  likelihood: string;
  distinguishing_feature: string;
}

export interface PestDiagnosis {
  crop: string;
  primary_diagnosis: string;
  primary_diagnosis_ur: string;
  scientific_name: string;
  category: string;
  confidence: string;
  symptom_analysis: string;
  risk_factors: string[];
  alternative_possibilities: AlternativeDiagnosis[];
  non_chemical_management: string[];
  verified_treatment?: VerifiedTreatment | null;
  dosage_disclaimer: string;
  safety_notes: string[];
  phi_days?: number;
  is_medical_query_rejected: boolean;
  medical_rejection_notice?: string | null;
  source: string;
  image_supported: boolean;
}

export interface PestDiagnosisRequest {
  crop?: string;
  symptoms: string;
  district?: string;
  acres?: number;
  image_data?: string | null;
}


