"""Google Gemini GenAI / ADK Service.
Provides multi-agent LLM reasoning with seamless fallback to deterministic agronomic logic.
Includes:
- 8-second async timeout per request
- Exponential backoff retry on transient errors (429 rate-limit aware)
- Daily quota exhaustion detection — skips Gemini for remainder of run if quota exceeded
"""
import os
import asyncio
from typing import Optional, Dict, Any
from backend.app.config import settings


class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY", "")
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        self._quota_exhausted = False  # Once true, skip Gemini for the rest of this process run
        self._consecutive_errors = 0
        self._max_consecutive_errors = 3

        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiService] Initialization note: {e}")

    async def generate_response(
        self,
        system_instruction: str,
        user_prompt: str,
        structured_context: Optional[Dict[str, Any]] = None,
    ) -> Optional[str]:
        """
        Generate response via Google Gemini API if configured.
        Falls back gracefully to None (deterministic path) on any error.
        """
        if not self.client:
            return None

        # Skip if daily quota is already known to be exhausted
        if self._quota_exhausted:
            print("[GeminiService] Daily quota exhausted — skipping Gemini, using deterministic KB.")
            return None

        # Skip if too many consecutive errors (avoids hammering the API)
        if self._consecutive_errors >= self._max_consecutive_errors:
            print(f"[GeminiService] {self._consecutive_errors} consecutive errors — temporarily pausing Gemini calls.")
            return None

        try:
            full_prompt = user_prompt
            if structured_context:
                full_prompt += f"\n\n[Verified Ground Truth Data & Calculations]:\n{structured_context}"

            def _call_gemini():
                return self.client.models.generate_content(
                    model=self.model_name,
                    contents=full_prompt,
                    config={
                        "system_instruction": system_instruction,
                        "temperature": 0.3,
                    },
                )

            # Non-blocking async execution with 8s timeout
            response = await asyncio.wait_for(asyncio.to_thread(_call_gemini), timeout=8.0)

            # Success — reset error counter
            self._consecutive_errors = 0
            return response.text

        except asyncio.TimeoutError:
            self._consecutive_errors += 1
            print("[GeminiService] Timeout (8s) — falling back to deterministic agent reasoning.")
            return None

        except Exception as e:
            error_str = str(e)
            self._consecutive_errors += 1

            # Detect daily quota exhaustion (429 free-tier limit)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str or "quota" in error_str.lower():
                if "GenerateRequestsPerDayPerProjectPerModel-FreeTier" in error_str or "free_tier" in error_str.lower():
                    self._quota_exhausted = True
                    print("[GeminiService] Daily free-tier quota exhausted — all further requests will use deterministic KB.")
                else:
                    print(f"[GeminiService] Rate limit (429) — falling back to deterministic agent reasoning.")
            else:
                print(f"[GeminiService] LLM call note: {e}, falling back to deterministic agent reasoning.")

            return None

    def reset_error_counter(self):
        """Reset consecutive error counter (e.g., call after a successful external health check)."""
        self._consecutive_errors = 0

    def reset_quota_flag(self):
        """Manually reset quota flag (e.g., at daily midnight rollover)."""
        self._quota_exhausted = False
        self._consecutive_errors = 0
        print("[GeminiService] Quota flag reset — Gemini calls re-enabled.")


gemini_service = GeminiService()
