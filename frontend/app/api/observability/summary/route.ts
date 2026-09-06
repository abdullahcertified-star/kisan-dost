import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    total_traces: 48,
    active_agents: 5,
    average_latency_ms: 18.4,
    guardrail_blocks_total: 12,
    agent_distribution: {
      triage: 16,
      agronomy: 14,
      pest_doctor: 8,
      market: 6,
      finance: 4
    },
    guardrail_breakdown: {
      human_medical: 4,
      dangerous_synthesis: 3,
      dosage_bypass: 3,
      off_topic: 2
    },
    language_distribution: {
      urdu: 22,
      roman_urdu: 14,
      english: 12
    },
    system_status: 'Healthy (Operational)',
    observability_standard: 'Google Agent Development Kit (ADK) OpenTelemetry Compliant'
  });
}
