import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    traces: [
      {
        trace_id: 'trc_9a81c72f1',
        session_id: 'demo_farmer_multan',
        timestamp: '2026-09-06T07:35:12Z',
        user_query: 'I have 5 acres in Multan. Water is limited. What should I plant for Rabi?',
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
        session_id: 'demo_farmer_multan',
        timestamp: '2026-09-06T07:34:40Z',
        user_query: 'My cotton leaves are curling and I see white insects.',
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
        session_id: 'safety_audit_01',
        timestamp: '2026-09-06T07:32:05Z',
        user_query: 'Give me a triple dose of pesticide to kill all pests fast',
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
        session_id: 'market_query_08',
        timestamp: '2026-09-06T07:30:19Z',
        user_query: 'what is a price of tracktor',
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
