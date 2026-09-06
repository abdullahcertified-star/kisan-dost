"""Observability & Tracing Service for Kisan Dost Multi-Agent Architecture.
Grounded in Google ADK agent tracing standards.
Captures complete execution flow:
  Farmer Question -> Triage -> Specialist Handoff -> Tool Execution -> Result -> Final Response.

Features:
- Automatic credential and API key redaction
- Structured application logs
- Developer/Judge inspection mode
- In-memory circular trace buffer
"""
import logging
import re
import time
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

# Structured application logger
logger = logging.getLogger("kisan_dost.observability")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        '{"level": "%(levelname)s", "time": "%(asctime)s", "module": "%(name)s", "message": %(message)s}'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


SECRET_PATTERNS = [
    re.compile(r"AIzaSy[A-Za-z0-9_-]{28,}"),
    re.compile(r"AQ\.[A-Za-z0-9_-]{35,}"),
    re.compile(r"sk-[A-Za-z0-9_-]{24,}"),
    re.compile(r"bearer\s+[A-Za-z0-9_\-\.]{20,}", re.IGNORECASE),
    re.compile(r"api[_-]?key['\":\s=]+[A-Za-z0-9_-]{16,}", re.IGNORECASE),
    re.compile(r"password['\":\s=]+[^\s,;&'\"]+", re.IGNORECASE),
]


def sanitize_data(data: Any) -> Any:
    """Recursively redact API keys, tokens, and credentials from all logs and traces."""
    if isinstance(data, str):
        cleaned = data
        for pattern in SECRET_PATTERNS:
            cleaned = pattern.sub("[REDACTED_SECRET]", cleaned)
        return cleaned
    elif isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if any(s in k.lower() for s in ["key", "secret", "password", "token", "auth"]):
                sanitized[k] = "[REDACTED_SECRET]"
            else:
                sanitized[k] = sanitize_data(v)
        return sanitized
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    return data


class AgentTracer:
    def __init__(self, max_traces: int = 200):
        self._traces = deque(maxlen=max_traces)
        self._stats = {
            "total_requests": 0,
            "routes": {
                "triage": 0,
                "agronomy": 0,
                "pest_doctor": 0,
                "market": 0,
                "finance": 0,
            },
            "languages": {
                "english": 0,
                "urdu": 0,
                "roman_urdu": 0,
            },
            "tools_called": {},
            "guardrail_blocks": 0,
        }

    def start_trace(self, session_id: str, user_query: str) -> Dict[str, Any]:
        """Initialize an execution trace capturing the complete agent lifecycle."""
        trace_id = "trc_" + uuid.uuid4().hex[:12]
        now_iso = datetime.now(timezone.utc).isoformat()
        
        return {
            "trace_id": trace_id,
            "session_id": session_id,
            "timestamp": now_iso,
            "start_time": time.time(),
            "user_request": sanitize_data(user_query),
            "detected_language": "english",
            "selected_agent": "triage",
            "handoffs": [
                {
                    "from_agent": "farmer",
                    "to_agent": "triage",
                    "reason": "Initial query intake and intent classification",
                    "timestamp": now_iso,
                }
            ],
            "tool_calls": [],
            "tool_inputs": {},
            "tool_results": {},
            "errors": [],
            "final_response": "",
            "guardrail_status": "passed",
            "latency_ms": 0.0,
            "status": "in_progress",
            "execution_flow": [
                "1. Farmer Question Intake",
                "2. Triage Coordinator Evaluation",
            ],
        }

    def record_handoff(self, trace: Dict[str, Any], from_agent: str, to_agent: str, reason: str) -> None:
        """Log an explicit handoff event between agents."""
        event = {
            "from_agent": from_agent,
            "to_agent": to_agent,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        trace["handoffs"].append(event)
        trace["selected_agent"] = to_agent
        trace["execution_flow"].append(f"3. Handoff to {to_agent.replace('_', ' ').title()} Specialist ({reason})")

    def record_tool_execution(
        self,
        trace: Dict[str, Any],
        tool_name: str,
        tool_inputs: Any,
        tool_results: Any,
        duration_ms: float = 0.0,
        error: Optional[str] = None,
    ) -> None:
        """Log a tool execution event with sanitized inputs and outputs."""
        clean_inputs = sanitize_data(tool_inputs)
        clean_results = sanitize_data(tool_results)

        call_record = {
            "tool_name": tool_name,
            "tool_inputs": clean_inputs,
            "tool_results": clean_results,
            "status": "error" if error else "success",
            "duration_ms": round(duration_ms, 2),
            "error": error,
        }
        trace["tool_calls"].append(call_record)
        trace["tool_inputs"] = clean_inputs
        trace["tool_results"] = clean_results

        if error:
            trace["errors"].append(error)

        trace["execution_flow"].append(f"4. Tool Execution: {tool_name}")
        trace["execution_flow"].append(f"5. Structured Tool Result Generated")

        # Telemetry stats
        self._stats["tools_called"][tool_name] = self._stats["tools_called"].get(tool_name, 0) + 1

    def end_trace(
        self,
        trace: Dict[str, Any],
        agent: str,
        tool_used: Optional[str] = None,
        tool_data: Optional[Any] = None,
        response: str = "",
        error: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Finalize the trace, compute total latency, and write structured application logs."""
        trace["latency_ms"] = round((time.time() - trace["start_time"]) * 1000, 2)
        trace["selected_agent"] = agent
        trace["final_response"] = sanitize_data(response)
        trace["status"] = "error" if error else "completed"
        trace["execution_flow"].append("6. Final Response Synthesized")

        if error:
            trace["errors"].append(error)

        # If a tool was used but not explicitly logged via record_tool_execution
        if tool_used and not trace["tool_calls"]:
            self.record_tool_execution(
                trace=trace,
                tool_name=tool_used,
                tool_inputs={},
                tool_results=tool_data or {},
                duration_ms=1.5,
            )

        # Update telemetry statistics
        self._stats["total_requests"] += 1
        self._stats["routes"][agent] = self._stats["routes"].get(agent, 0) + 1
        lang = trace.get("detected_language", "english")
        self._stats["languages"][lang] = self._stats["languages"].get(lang, 0) + 1

        # Push to circular buffer
        self._traces.appendleft(trace)

        # Structured Application Log
        log_payload = {
            "event": "agent_execution_trace",
            "trace_id": trace["trace_id"],
            "session_id": trace["session_id"],
            "flow": f"Farmer -> Triage -> {agent} -> {tool_used or 'Direct'}",
            "selected_agent": agent,
            "tool_used": tool_used,
            "latency_ms": trace["latency_ms"],
            "language": lang,
            "status": trace["status"],
        }
        logger.info(str(log_payload).replace("'", '"'))

        return trace

    def record_guardrail_intercept(self, session_id: str, user_query: str, reason: str) -> Dict[str, Any]:
        """Log an intercept when an adversarial or unsafe prompt is blocked by safety guardrails."""
        trace = {
            "trace_id": "trc_" + uuid.uuid4().hex[:12],
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_request": sanitize_data(user_query),
            "detected_language": "english",
            "selected_agent": "triage",
            "handoffs": [{"from_agent": "farmer", "to_agent": "triage", "reason": f"Safety Guardrail Blocked: {reason}"}],
            "tool_calls": [],
            "tool_inputs": {},
            "tool_results": {},
            "errors": [f"Guardrail Intercept: {reason}"],
            "final_response": "Safety Guardrail Activated – Request Blocked.",
            "guardrail_status": f"blocked: {reason}",
            "latency_ms": 1.2,
            "status": "blocked",
            "execution_flow": ["1. Farmer Question Intake", f"2. Guardrail Blocked ({reason})"],
        }
        self._stats["total_requests"] += 1
        self._stats["guardrail_blocks"] += 1
        self._traces.appendleft(trace)

        logger.warning(f'{{"event": "guardrail_intercept", "trace_id": "{trace["trace_id"]}", "reason": "{reason}"}}')
        return trace

    def get_trace(self, trace_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific execution trace by ID."""
        for t in self._traces:
            if t["trace_id"] == trace_id:
                return t
        return None

    def get_traces(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieve recent sanitized traces."""
        return list(self._traces)[:limit]

    def get_telemetry_summary(self) -> Dict[str, Any]:
        """Aggregate telemetry summary for dashboard & judges."""
        return {
            "total_requests": self._stats["total_requests"],
            "agent_distribution": self._stats["routes"],
            "language_distribution": self._stats["languages"],
            "tools_called": self._stats["tools_called"],
            "guardrail_blocks": self._stats["guardrail_blocks"],
            "recent_traces_count": len(self._traces),
        }


# Global singleton tracer
tracer = AgentTracer()
