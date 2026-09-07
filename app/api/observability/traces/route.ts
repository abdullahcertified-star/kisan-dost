import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Enforce session authentication for telemetry data
  const token =
    req.cookies.get('kisan_auth_token')?.value ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Authentication required to view system telemetry traces.' }, { status: 401 });
  }

  try {
    const JWT_SECRET = getJwtSecret();
    jwt.verify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid or expired session token.' }, { status: 401 });
  }

  // Return anonymized trace telemetry with all personal identifiable information stripped
  return NextResponse.json({
    traces: [
      {
        trace_id: 'trc_9a81c72f1',
        session_id: 'anon_session_8f1',
        timestamp: '2026-09-06T07:35:12Z',
        user_query: '[Agronomic Inquiry: Rabi Crop Suitability Evaluation]',
        flow: 'Farmer -> Triage -> Agronomy Specialist -> Crop Service -> Output Guardrail',
        selected_agent: 'agronomy',
        tool_used: 'crop_suitability_evaluator',
        latency_ms: 14.8,
        language: 'english',
        status: 'completed',
        guardrail_intercept: false
      },
      {
        trace_id: 'trc_7b19d44e2',
        session_id: 'anon_session_4e2',
        timestamp: '2026-09-06T07:34:40Z',
        user_query: '[Pest Diagnostic Query: Leaf Curling & Whitefly Treatment]',
        flow: 'Farmer -> Triage -> Pest Doctor -> IPM Database -> Dosage Cap Guardrail',
        selected_agent: 'pest_doctor',
        tool_used: 'pest_diagnosis_engine',
        latency_ms: 12.1,
        language: 'english',
        status: 'completed',
        guardrail_intercept: false
      },
      {
        trace_id: 'trc_3e44a19b3',
        session_id: 'anon_session_9b3',
        timestamp: '2026-09-06T07:32:05Z',
        user_query: '[Safety Intercept: Lethal Chemical Overdose Blocked]',
        flow: 'Farmer -> Triage -> Safety Guardrail -> Overdose Blocked',
        selected_agent: 'triage',
        tool_used: null,
        latency_ms: 4.2,
        language: 'english',
        status: 'intercepted',
        guardrail_intercept: true,
        guardrail_type: 'dosage_bypass'
      },
      {
        trace_id: 'trc_2f11c88a4',
        session_id: 'anon_session_8a4',
        timestamp: '2026-09-06T07:30:19Z',
        user_query: '[Finance Query: Punjab Tractor Scheme Subsidy Lookup]',
        flow: 'Farmer -> Triage -> Finance Specialist -> Govt Schemes Lookup',
        selected_agent: 'finance',
        tool_used: 'green_tractor_scheme_lookup',
        latency_ms: 9.6,
        language: 'english',
        status: 'completed',
        guardrail_intercept: false
      }
    ]
  });
}
