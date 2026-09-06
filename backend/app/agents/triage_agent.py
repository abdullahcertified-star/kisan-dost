import json
from typing import Dict, Any

from backend.app.guardrails.input_guardrails import (
    InputGuardrail,
    _matches_any,
    JAILBREAK_PATTERNS,
    DANGEROUS_SYNTHESIS_PATTERNS,
    VAGUE_DOSAGE_PATTERNS,
)
from backend.app.services.context_service import get_context, update_context
from backend.app.services.language_utils import detect_language
from backend.app.services.tracer import tracer
from backend.app.agents.agronomy_agent import handle_query as agronomy_handle, _extract_planting_info
from backend.app.agents.market_agent import handle_query as market_handle
from backend.app.agents.finance_agent import handle_query as finance_handle
from backend.app.agents.pest_doctor_agent import PestDoctorAgent, PestDiagnosisRequest
from backend.app.models.schemas import ChatRequest, ChatResponse

pest_doctor_agent = PestDoctorAgent()


async def route_to_agent(user_query: str, farmer_id: str) -> Dict:
    """Determine which specialist should handle the request and delegate to it.
    Traces the entire execution chain according to Google ADK observability standards:
    Farmer Question -> Triage -> Specialist Handoff -> Tool Call -> Result -> Final Response.
    """
    lowered = user_query.lower()
    detected_lang = detect_language(user_query)
    trace = tracer.start_trace(farmer_id, user_query)
    trace["detected_language"] = detected_lang

    # ---------- Comprehensive Safety & Content Guardrails ----------
    is_valid, rejection_msg = InputGuardrail.validate_input(user_query)
    if not is_valid and rejection_msg:
        g_type = "safety_violation"
        if "Medical" in rejection_msg or "طبی" in rejection_msg:
            g_type = "human_medical"
        elif "Off-Topic" in rejection_msg or "غیر متعلقہ" in rejection_msg:
            g_type = "off_topic"
        elif "Safety Guardrail" in rejection_msg or "حفاظتی اصول" in rejection_msg:
            g_type = "jailbreak"
        elif "Unsafe Request" in rejection_msg or "غیر محفوظ" in rejection_msg:
            g_type = "dangerous_synthesis"
        elif "Overdose Blocked" in rejection_msg or "اوور ڈوز" in rejection_msg:
            g_type = "dosage_bypass"

        tracer.record_guardrail_intercept(farmer_id, user_query, g_type)
        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=rejection_msg
        )
        return {
            "agent": "triage",
            "category": f"{g_type}_blocked",
            "response": rejection_msg,
            "context": get_context(farmer_id),
            "debug_trace": final_trace,
        }

    if _matches_any(lowered, VAGUE_DOSAGE_PATTERNS):
        tracer.record_guardrail_intercept(farmer_id, user_query, "vague_dosage")
        resp_text = "Please describe the crop symptoms before dosage can be recommended. (برائے مہربانی خوراک جاننے سے پہلے اپنی فصل کی علامات بتائیں۔)"
        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=resp_text
        )
        return {
            "agent": "triage",
            "category": "vague_guidance",
            "response": resp_text,
            "context": get_context(farmer_id),
            "debug_trace": final_trace,
        }

    # Extract any context updates present in the message (e.g. Multan, 5 acres, limited water)
    extracted_info = _extract_planting_info(user_query)
    if extracted_info:
        update_context(farmer_id, extracted_info)

    # Intent classification
    intent = InputGuardrail.classify_intent(user_query)
    trace["intent"] = intent
    context = get_context(farmer_id)
    update_context(farmer_id, context)

    result = None

    if intent == "greeting":
        if detected_lang == "urdu":
            resp_text = (
                "السلام علیکم! کسان دوست اے آئی اسسٹنٹ میں خوش آمدید۔ 🌾\n\n"
                "میں آپ کا مرکزی رابطہ کار (Triage Coordinator) ہوں۔ آپ ہم سے درج ذیل خدمات حاصل کر سکتے ہیں:\n"
                "• 🌾 **ماہر زراعت (Agronomy Specialist)**: ربیع و خریف کے لیے فصل کا انتخاب اور یوریا و ڈی اے پی کھاد کا درست حساب\n"
                "• 🔬 **پیسٹ ڈاکٹر (Pest Doctor)**: سفید مکھی، سنڈی یا فصل کی بیماریوں کی تشخیص اور تصدیق شدہ محفوظ علاج\n"
                "• 📈 **منڈی ریٹس (Mandi Market)**: غلہ منڈیوں کے روزانہ سرکاری ہول سیل ریٹس (AMIS پنجاب ڈیٹا)\n"
                "• 💰 **فنانس و اسکیمز (Finance & Subsidies)**: فی ایکڑ خالص منافع کا حساب اور وزیر اعلیٰ کسان کارڈ بلاسود قرض اسکیم\n\n"
                "براہ کرم بتائیں، آپ اپنے فارم یا فصل کے بارے میں کیا جاننا چاہتے ہیں؟"
            )
        elif detected_lang == "roman_urdu":
            resp_text = (
                "Assalam-o-Alaikum! Kisan Dost AI Assistant mein khush-aamdeed. 🌾\n\n"
                "Main aap ka Triage Coordinator hoon. Aap hum se in maaloomaat ke baray mein pooch sakte hain:\n"
                "• 🌾 **Agronomy Specialist**: Rabi/Kharif fasal ka intekhab aur Urea/DAP khad ka exact hisab\n"
                "• 🔬 **Pest Doctor**: Kapas, gandum ki bimariyan aur keeron ka safe dosage elaj\n"
                "• 📈 **Mandi Rates**: Punjab mandiyon ke daily wholesale rates (AMIS official data)\n"
                "• 💰 **Finance & Subsidies**: Per-acre munafa model aur CM Punjab Kisan Card schemes\n\n"
                "Aap aaj apne farm ya fasal ke baray mein kya poochna chahte hain?"
            )
        else:
            resp_text = (
                "Welcome to Kisan Dost AI Assistant! 🌾\n\n"
                "I am your central Triage Coordinator. How can our specialists assist your farm today?\n"
                "• 🌾 **Agronomy Specialist**: Crop selection based on water/soil and precision fertilizer plans (Urea & DAP)\n"
                "• 🔬 **Pest Doctor**: Verified crop pest/disease diagnosis with strict dosage-capped IPM treatments\n"
                "• 📈 **Mandi Rates**: Live AMIS Punjab wholesale market rates for all major commodities\n"
                "• 💰 **Finance & Subsidies**: Profitability budgeting, break-even analysis, and CM Punjab Kisan Card financing\n\n"
                "Please tell me your district, acreage, or ask any farming question to get started!"
            )
        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=resp_text
        )
        return {
            "agent": "triage",
            "category": "greeting",
            "response": resp_text,
            "context": context,
            "debug_trace": final_trace,
        }

    elif intent == "gratitude":
        if detected_lang == "urdu":
            resp_text = (
                "خوش آمدید! آپ کا بہت شکریہ۔ 🌾\n\n"
                "مجھے خوشی ہے کہ میں آپ کے کام آ سکا۔ اگر آپ کو اپنی فصل، کھاد کے حساب، منڈی کے ریٹس، بیماریوں کے علاج یا کسان کارڈ کے بارے میں مزید کوئی سوال ہو تو بلا جھجھک پوچھیں۔ کسان دوست ہمیشہ آپ کی خدمت کے لیے حاضر ہے! 🚜"
            )
        elif detected_lang == "roman_urdu":
            resp_text = (
                "Khush-aamdeed! Bohat shukriya. 🌾\n\n"
                "Mujhe khushi hui ke main aap ke kaam aa saka. Agar aap ko apni fasal, khad, mandi rates ya kisi bimari ke baray mein mazeed koi sawal ho to bila-jijhak poochiye. Happy farming! 🚜"
            )
        else:
            resp_text = (
                "You are very welcome! 🌾\n\n"
                "I'm glad I could assist your farm today. If you have any further questions about crop planning, fertilizer dosing, pest control, mandi prices, or subsidies, feel free to ask anytime. Happy farming! 🚜"
            )
        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=resp_text
        )
        return {
            "agent": "triage",
            "category": "gratitude",
            "response": resp_text,
            "context": context,
            "debug_trace": final_trace,
        }

    elif intent == "acknowledgement":
        if detected_lang == "urdu":
            resp_text = "بہترین! اگر آپ کو اپنے فارم کے لیے کسی اور رہنمائی یا حساب کتاب کی ضرورت ہو تو ضرور بتائیے گا۔ 🌾"
        elif detected_lang == "roman_urdu":
            resp_text = "Behtareen! Agar aap ko farm ke kisi aur maamlay mein rehnumai darkar ho to zaroor batayein. 🌾"
        else:
            resp_text = "Understood! Let me know whenever you need more advice on your crops, fertilizers, or market prices. Wishing you a successful harvest! 🌾"

        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=resp_text
        )
        return {
            "agent": "triage",
            "category": "acknowledgement",
            "response": resp_text,
            "context": context,
            "debug_trace": final_trace,
        }

    elif intent == "farewell":
        if detected_lang == "urdu":
            resp_text = (
                "اللہ حافظ! اپنا اور اپنے کھیتوں کا خیال رکھیے گا۔ 🌾\n\n"
                "اگر آئندہ فصل، کھاد کے حساب، منڈی ریٹس یا کسی بیماری سے متعلق کوئی بھی مدد درکار ہو تو کسان دوست ہمیشہ آپ کی خدمت کے لیے حاضر ہے۔ اللہ آپ کی فصل میں ڈھیروں برکت ڈالے! 🚜"
            )
        elif detected_lang == "roman_urdu":
            resp_text = (
                "Allah Hafiz! Apna aur apni fasal ka khayal rakhein. 🌾\n\n"
                "Jab bhi zaroorat ho, Kisan Dost hamesha aap ki rehnumai ke liye hazir hai. Wishing you a profitable harvest! 🚜"
            )
        else:
            resp_text = (
                "Goodbye and Allah Hafiz! 🌾\n\n"
                "Take great care of your farm and crops. Whenever you need agricultural guidance, fertilizer calculations, or market prices, Kisan Dost is always here for you. Wishing you a bountiful and prosperous harvest! 🚜"
            )

        final_trace = tracer.end_trace(
            trace=trace,
            agent="triage",
            tool_used=None,
            tool_data=None,
            response=resp_text
        )
        return {
            "agent": "triage",
            "category": "farewell",
            "response": resp_text,
            "context": context,
            "debug_trace": final_trace,
        }

    elif intent == "crop_advisor":
        tracer.record_handoff(trace, from_agent="triage", to_agent="agronomy", reason="Crop suitability & agronomy planning requested")
        result = agronomy_handle(user_query, farmer_id, language=detected_lang)
    elif intent == "pest_diagnosis":
        tracer.record_handoff(trace, from_agent="triage", to_agent="pest_doctor", reason="Plant health symptoms or insect pests reported")
        # Extract crop candidate from query or context
        crop_candidate = context.get("current_crop") or "cotton"
        for c in ["cotton", "kapas", "wheat", "gandum", "rice", "chawal", "maize", "makai", "potato", "aloo", "tomato"]:
            if c in lowered:
                crop_candidate = "cotton" if c in ("cotton", "kapas") else ("wheat" if c in ("wheat", "gandum") else c)
                break

        request = PestDiagnosisRequest(
            crop=crop_candidate,
            symptoms=user_query,
            district=context.get("district") or "Multan",
            acres=context.get("acreage") or context.get("land_acres") or 5.0,
        )
        diagnosis = await pest_doctor_agent.diagnose(request)
        treatment_info = ""
        if diagnosis.non_chemical_management:
            treatment_info += f" Cultural: {'; '.join(diagnosis.non_chemical_management[:2])}."
        if diagnosis.verified_treatment:
            vt = diagnosis.verified_treatment
            treatment_info += f" Chemical: {vt.active_ingredient} ({vt.safe_dosage_per_acre or 'See label'})."

        if detected_lang == "urdu":
            full_resp = (
                f"تشخیص: {diagnosis.primary_diagnosis_ur} (Confidence: {diagnosis.confidence})۔ "
                f"سفارش: {treatment_info} "
                f"کیڑے مکوڑوں کے معاشی نقصان کی حد کا باقاعدہ معائنہ کریں۔"
            )
        elif detected_lang == "roman_urdu":
            full_resp = (
                f"Tashkhees (Diagnosis): {diagnosis.primary_diagnosis} [{diagnosis.primary_diagnosis_ur}] "
                f"(Confidence: {diagnosis.confidence}). {treatment_info} "
                f"Kapas par safed makkhi ka scouting schedule jari rakhein."
            )
        else:
            full_resp = f"Diagnosis: {diagnosis.primary_diagnosis} ({diagnosis.primary_diagnosis_ur}) [Confidence: {diagnosis.confidence}].{treatment_info}"

        result = {
            "agent": "pest_doctor",
            "category": diagnosis.category,
            "response": full_resp,
            "tool_used": "PARC Pest Doctor",
            "tool_data": {
                "diagnosis": diagnosis.primary_diagnosis,
                "confidence": diagnosis.confidence,
                "chemical_treatment": vt.active_ingredient if diagnosis.verified_treatment else None,
            },
            "disclaimer": diagnosis.dosage_disclaimer,
            "context": context,
        }
    elif intent in ("general_agri", "vague_request"):
        from backend.app.agents.gemini_service import gemini_service
        sys_instruction = (
            "You are Kisan Dost ('Farmer's Friend'), an expert, polite Pakistani agricultural AI assistant. "
            "You answer farming, crop, fertilizer, pest, mandi price, and agricultural subsidy questions accurately and conversationally. "
            "Always respond in the same language as the user: if Urdu script, reply in fluent Urdu; if Roman Urdu, reply in Roman Urdu; if English, reply in English. "
            "Keep answers practical, encouraging, and focused on Pakistani smallholder agriculture. "
            "Never provide human medical advice, and always recommend officially registered agricultural solutions."
        )
        gemini_reply = await gemini_service.generate_response(
            system_instruction=sys_instruction,
            user_prompt=user_query,
            structured_context=context,
        )
        if gemini_reply and len(gemini_reply.strip()) > 0:
            result = {
                "agent": "agronomy",
                "category": "ai_conversation",
                "response": gemini_reply.strip(),
                "tool_used": "Google Gemini GenAI Assistant",
                "tool_data": {"source": "gemini-3.6-flash"},
                "context": context,
            }
        else:
            tracer.record_handoff(trace, from_agent="triage", to_agent="agronomy", reason="General agronomy, weather, or fertilizer guidance")
            result = agronomy_handle(user_query, farmer_id, language=detected_lang)
    elif intent == "finance":
        tracer.record_handoff(trace, from_agent="triage", to_agent="finance", reason="Profit calculation or government schemes consultation")
        result = finance_handle(user_query, farmer_id, language=detected_lang)
    elif intent == "market":
        tracer.record_handoff(trace, from_agent="triage", to_agent="market", reason="Wholesale Mandi price rate lookup")
        result = market_handle(user_query, farmer_id, language=detected_lang)
    else:
        result = {
            "agent": "triage",
            "category": "unknown",
            "response": "I'm sorry, I couldn't understand your request. Please ask a farming-related question.",
            "context": context,
        }

    # Record tool execution if a tool was invoked
    tool_name = result.get("tool_used")
    if tool_name:
        tracer.record_tool_execution(
            trace=trace,
            tool_name=tool_name,
            tool_inputs={
                "crop": context.get("current_crop", "cotton"),
                "district": context.get("district", "Multan"),
                "acres": context.get("acreage", 5.0),
            },
            tool_results=result.get("tool_data") or {"category": result.get("category")},
            duration_ms=2.1,
        )

    # Finalize observability trace
    final_trace = tracer.end_trace(
        trace=trace,
        agent=result.get("agent", "triage"),
        tool_used=tool_name,
        tool_data=result.get("tool_data"),
        response=result.get("response", "")
    )
    result["debug_trace"] = final_trace

    return result


async def handle_query(user_query: str, farmer_id: str) -> Dict:
    """Public entry point used by the ADK router. Returns routing result and context."""
    result = await route_to_agent(user_query, farmer_id)
    result.setdefault("context", get_context(farmer_id))
    return result


class TriageAgent:
    """FastAPI-compatible wrapper exposing the triage routing."""

    @staticmethod
    async def process_message(req: ChatRequest, db) -> ChatResponse:
        farmer_id = req.session_id or "default_farmer"
        updates = {}
        if req.district:
            updates["district"] = req.district
        if req.land_acres:
            updates["acreage"] = req.land_acres
            updates["land_acres"] = req.land_acres
        if req.current_crop:
            updates["current_crop"] = req.current_crop
        if updates:
            update_context(farmer_id, updates)

        result = await handle_query(req.message, farmer_id)
        response_dict: Dict[str, Any] = {
            "session_id": farmer_id,
            "response": result.get("response", ""),
            "agent_name": result.get("agent", "triage"),
            "tool_used": result.get("tool_used"),
            "tool_data": result.get("tool_data"),
            "disclaimer": result.get("disclaimer"),
            "debug_trace": result.get("debug_trace"),
        }
        return ChatResponse(**response_dict)
