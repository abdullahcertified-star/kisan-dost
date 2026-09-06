/**
 * Kisan Dost API Client
 * Connects to the FastAPI backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== ''
    ? process.env.NEXT_PUBLIC_API_URL
    : typeof window !== 'undefined'
    ? ''
    : 'http://127.0.0.1:8000';

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  environment: string;
}

export interface ChatMessagePayload {
  session_id?: string;
  message: string;
  district?: string;
  land_acres?: number;
  current_crop?: string;
  soil_type?: string;
  language?: string;
}

export interface ChatResponsePayload {
  session_id: string;
  response: string;
  agent_name: string;
  tool_used?: string;
  tool_data?: any;
  disclaimer?: string;
}

export interface FarmerProfileData {
  id?: string;
  name: string;
  district: string;
  province: string;
  land_acres: number;
  soil_type: string;
  water_availability: string;
  current_crop: string;
  preferred_language: string;
  created_at?: string;
  updated_at?: string;
}

export async function createFarmerProfile(data: FarmerProfileData): Promise<FarmerProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/farmer/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function getFarmerProfile(id: string): Promise<FarmerProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/farmer/profile/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch profile (Status: ${response.status})`);
  }
  return response.json();
}

export async function updateFarmerProfile(id: string, data: Partial<FarmerProfileData>): Promise<FarmerProfileData> {
  const response = await fetch(`${API_BASE_URL}/api/farmer/profile/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }
  return response.json();
}

export async function sendChatMessage(payload: ChatMessagePayload): Promise<ChatResponsePayload> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Chat request failed with status: ${response.status}`);
  }
  return response.json();
}

export async function fetchWeather(district: string) {
  const response = await fetch(`${API_BASE_URL}/api/tools/weather/${encodeURIComponent(district)}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed to fetch weather for ${district} (HTTP ${response.status})`);
  }
  return response.json();
}

import { CropPlan, CropRecommendationRequest } from '../types';

export async function fetchCropRecommendations(data: CropRecommendationRequest): Promise<CropPlan> {
  const response = await fetch(`${API_BASE_URL}/api/agriculture/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchCropAdvisor(data: { district: string; soil_type: string; season: string; land_acres: number; water_availability?: string }) {
  const payload = {
    water_availability: 'Limited',
    province: 'Punjab',
    ...data,
  };
  const response = await fetch(`${API_BASE_URL}/api/agriculture/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Failed to run crop advisor');
  return response.json();
}

export async function fetchFertilizerPlan(data: { crop: string; acres: number }) {
  const response = await fetch(`${API_BASE_URL}/api/tools/fertilizer-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to run fertilizer calculator');
  return response.json();
}

export async function calculateFertilizerRequirement(data: {
  crop: string;
  acres: number;
  soil_type?: string;
  target_yield?: number | null;
  preferred_language?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/fertilizer/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchPestDiagnosis(data: { crop: string; symptoms: string; acres: number }) {
  const response = await fetch(`${API_BASE_URL}/api/tools/pest-doctor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to run pest doctor');
  return response.json();
}

export async function fetchMandiPrices(commodity: string, mandi?: string) {
  const url = new URL(`${API_BASE_URL}/api/tools/mandi-prices`);
  url.searchParams.append('commodity', commodity);
  if (mandi) url.searchParams.append('mandi', mandi);
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Failed to fetch mandi prices');
  return response.json();
}

export async function fetchProfitEstimate(data: { crop: string; acres: number }) {
  const response = await fetch(`${API_BASE_URL}/api/tools/profit-estimator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to calculate profit estimate');
  return response.json();
}

export async function fetchGovtSchemes(province = 'Punjab', acres = 5.0) {
  const response = await fetch(`${API_BASE_URL}/api/tools/govt-schemes?province=${encodeURIComponent(province)}&acres=${acres}`);
  if (!response.ok) throw new Error('Failed to fetch government schemes');
  return response.json();
}

import { MandiPricesResponse, ProfitInput, ProfitEstimate, PestDiagnosis, PestDiagnosisRequest } from '../types';

export async function fetchMarketPrices(crop?: string, market?: string): Promise<MandiPricesResponse> {
  const url = new URL(`${API_BASE_URL}/api/market/prices`);
  if (crop && crop !== 'All Crops') url.searchParams.append('crop', crop);
  if (market && market !== 'All Markets') url.searchParams.append('market', market);
  const response = await fetch(url.toString());
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function calculateProfit(payload: ProfitInput): Promise<ProfitEstimate> {
  const response = await fetch(`${API_BASE_URL}/api/profit/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Failed with status ${response.status}`);
  }
  return response.json();
}

export async function diagnosePestProblem(payload: PestDiagnosisRequest): Promise<PestDiagnosis> {
  const response = await fetch(`${API_BASE_URL}/api/pest-doctor/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ? (Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail) : `Diagnosis failed with status ${response.status}`);
  }
  return response.json();
}

export async function fetchPestDatabase(crop?: string): Promise<any[]> {
  const url = new URL(`${API_BASE_URL}/api/pest-doctor/database`);
  if (crop && crop !== 'All Crops' && crop !== 'All') url.searchParams.append('crop', crop);
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error('Failed to fetch pest knowledge base');
  }
  return response.json();
}


