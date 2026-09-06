"""Pest & Disease Doctor Agent for Kisan Dost.
Uses Google Gemini / ADK grounded strictly in verified Pakistani agronomic data
from PARC, NARC, and Punjab Agriculture Extension.

STRICT SAFETY DIRECTIVES:
- Zero invented pesticide dosages
- Zero arbitrary chemical recommendations
- Label disclaimer enforcement if dosage is unverified
- Immediate rejection of human medical queries
- Jailbreak / prompt injection resistance
- Dangerous synthesis requests blocked
- Crop advisor queries routed to crop advisor
- Vague non-symptom requests guided to describe symptoms
"""
import re
from typing import Optional, Dict
from backend.app.models.schemas import (
    PestDiagnosisRequest,
    PestDiagnosis,
    VerifiedTreatment,
    AlternativeDiagnosis,
)
from backend.app.services.pest_service import pest_service
from backend.app.guardrails.input_guardrails import InputGuardrail, HUMAN_MEDICAL_KEYWORDS
from backend.app.guardrails.output_safety_validator import OutputSafetyValidator
from backend.app.agents.gemini_service import gemini_service


PEST_DOCTOR_SYSTEM_INSTRUCTION = """You are 'Kisan Dost Pest & Disease Doctor Agent' (کسان دوست ڈاکٹر برائے فصل و امراض), an expert Pakistani plant pathologist and agronomic advisor.
Your role is to diagnose crop pests and diseases from farmer-described symptoms, strictly grounded in verified agronomic data from the Pakistan Agricultural Research Council (PARC) and Provincial Agriculture Departments.

CRITICAL SAFETY DIRECTIVES:
1. NEVER invent, hallucinate, or estimate pesticide dosages or chemical active ingredients.
2. NEVER generate arbitrary or off-label chemical recommendations.
3. If dosage information is not present or unverified, state explicitly that the exact dosage MUST be verified from the locally registered product container label or prescribed by your local Agriculture Extension Officer (محکمہ زراعت توسیع).
4. Always prioritize safe non-chemical management (cultural practices, pheromone/sticky traps, neem extracts, beneficial biocontrol predators) as first steps before chemical spray.
5. Explain diagnostic confidence qualitatively (High, Moderate, or Tentative / Low).
6. Explain alternative diagnostic possibilities and what distinguishing visual features separate them from the primary diagnosis.
7. Always emphasize Pre-Harvest Interval (PHI), personal protective equipment (PPE: gloves, mask, goggles), and protecting foraging pollinators (honeybees).
8. Provide warm, respectful advice in bilingual Urdu/Roman Urdu with concise English bullet points.
"""

# Standard mandatory label disclaimer — applied to every response
STANDARD_DOSAGE_DISCLAIMER = (
    "Exact chemical dosage must strictly be verified from the locally registered container label "
    "or prescribed by your local Agriculture Extension Officer (محکمہ زراعت). Never guess dosages."
)

# Standard PPE safety notes added to every agronomic diagnosis
STANDARD_SAFETY_NOTES = [
    "Always wear full PPE before spraying: chemical-resistant gloves, face mask/respirator, safety goggles, and full-body protective suit.",
    "Do NOT spray during peak bee activity hours (9 AM–3 PM). Protect foraging honeybees and pollinators.",
    "Store all pesticides in original registered containers, out of reach of children and animals.",
    "Observe the Pre-Harvest Interval (PHI) strictly — do not harvest before the stated number of days after last spray.",
    "Consult your local Agriculture Extension Officer (محکمہ زراعت توسیع) for locally registered product confirmation.",
]


def _make_guardrail_rejection(
    category: str,
    primary_diagnosis: str,
    primary_diagnosis_ur: str,
    symptom_analysis: str,
    non_chemical_management: list,
    safety_notes: list,
    dosage_disclaimer: str,
    is_medical: bool = False,
    medical_rejection_notice: Optional[str] = None,
) -> PestDiagnosis:
    """Helper to build a safe guardrail-rejection PestDiagnosis."""
    return PestDiagnosis(
        crop="N/A",
        primary_diagnosis=primary_diagnosis,
        primary_diagnosis_ur=primary_diagnosis_ur,
        scientific_name="N/A",
        category=category,
        confidence="Tentative / Low",
        symptom_analysis=symptom_analysis,
        risk_factors=[],
        alternative_possibilities=[],
        non_chemical_management=non_chemical_management,
        verified_treatment=None,
        dosage_disclaimer=dosage_disclaimer,
        safety_notes=safety_notes,
        phi_days=0,
        is_medical_query_rejected=is_medical,
        medical_rejection_notice=medical_rejection_notice,
        source="Kisan Dost Safety System",
        image_supported=True,
    )


class PestDoctorAgent:
    """Intelligent Pest Doctor Agent with Gemini reasoning and deterministic safety guardrails."""

    @staticmethod
    def is_human_medical_query(text: str) -> bool:
        """Check if farmer prompt is asking about human illness/medicine."""
        text_lower = text.strip().lower()
        for kw in HUMAN_MEDICAL_KEYWORDS:
            if re.search(r'\b' + re.escape(kw) + r'\b', text_lower):
                return True
        return False

    @classmethod
    async def diagnose(cls, req: PestDiagnosisRequest) -> PestDiagnosis:
        """
        Executes end-to-end pest diagnosis workflow:
        1. Human-medical query interception
        2. Jailbreak / dangerous synthesis interception
        3. Intent classification (pest_diagnosis / crop_advisor / vague / general_agri)
        4. Crop & symptom extraction
        5. Deterministic knowledge base lookup
        6. Gemini reasoning & bilingual agronomic explanation
        7. Output safety validation & dosage guardrail enforcement
        """
        raw_symptoms = req.symptoms.strip()

        # ── STEP 1: Intercept human medical queries ──────────────────────────────
        if cls.is_human_medical_query(raw_symptoms):
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Safety Intercept — Human Medical Query",
                    primary_diagnosis="Human Medical Inquiry Intercepted (طبی استفسار مسترد)",
                    primary_diagnosis_ur="انسانی طبی استفسار — غیر زرعی سوال",
                    symptom_analysis=(
                        "⚠️ **طبی انتباہ / Medical Safety Notice**:\n"
                        "Kisan Dost is an agricultural AI assistant strictly dedicated to crop health, plant pests, "
                        "fertilizers, and farming. We CANNOT diagnose human medical conditions, recommend human "
                        "medications, or provide healthcare advice. "
                        "Please consult a certified human medical doctor or visit your nearest hospital/clinic immediately."
                    ),
                    non_chemical_management=["Visit a licensed medical clinic or qualified physician immediately."],
                    safety_notes=[
                        "Consult a certified human physician or medical doctor immediately.",
                        "Do not consume or apply agricultural pesticides or crop chemicals for human health conditions.",
                        "For medical emergencies call 1122 (Rescue) or 115 (Edhi) in Pakistan.",
                    ],
                    dosage_disclaimer=(
                        "Kisan Dost is an agricultural assistant only and does not provide human medical advice."
                    ),
                    is_medical=True,
                    medical_rejection_notice=(
                        "Kisan Dost is an agricultural assistant only and does not provide human medical advice. "
                        "Please consult a qualified medical doctor."
                    ),
                ),
                raw_user_symptoms=raw_symptoms,
            )

        # ── STEP 2: Intercept jailbreak / dangerous synthesis / vague dosage ───────
        from backend.app.guardrails.input_guardrails import (
            _matches_any, JAILBREAK_PATTERNS, DANGEROUS_SYNTHESIS_PATTERNS, VAGUE_DOSAGE_PATTERNS
        )
        symptoms_lower = raw_symptoms.lower()

        if _matches_any(symptoms_lower, JAILBREAK_PATTERNS):
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Safety Intercept — Prompt Injection Attempt",
                    primary_diagnosis="Safety Guardrail Activated (حفاظتی اصول فعال)",
                    primary_diagnosis_ur="پرامپٹ انجیکشن مسترد",
                    symptom_analysis=(
                        "🛡️ **حفاظتی اصول / Safety Guardrail**:\n"
                        "Kisan Dost follows strict verified agricultural safety guidelines at all times. "
                        "Safety rules cannot be overridden, bypassed, or ignored by any instruction. "
                        "All chemical recommendations are exclusively from PARC and Punjab Agriculture Extension verified records.\n\n"
                        "**To get a genuine pest diagnosis**, please describe the actual symptoms you can see on your crop:\n"
                        "- What colour are the leaves / spots?\n"
                        "- Are there insects visible (under leaves, on stems)?\n"
                        "- Is there wilting, curling, drying, or unusual growth?"
                    ),
                    non_chemical_management=[
                        "Inspect your crop carefully for visible insects, spots, or discolouration.",
                        "Describe exactly what you observe: leaf colour, insect shape, affected parts.",
                        "Visit your nearest Agriculture Extension Office for physical crop inspection.",
                    ],
                    safety_notes=[
                        "All Kisan Dost recommendations follow PARC and Punjab Agriculture Extension verified guidelines.",
                        "Never apply any chemical without a proper diagnosis from a certified agronomist.",
                    ],
                    dosage_disclaimer=STANDARD_DOSAGE_DISCLAIMER,
                ),
                raw_user_symptoms=raw_symptoms,
            )

        if _matches_any(symptoms_lower, DANGEROUS_SYNTHESIS_PATTERNS):
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Safety Intercept — Dangerous Synthesis Request",
                    primary_diagnosis="Unsafe Request Blocked (غیر محفوظ درخواست مسترد)",
                    primary_diagnosis_ur="خطرناک مرکب — مسترد",
                    symptom_analysis=(
                        "⛔ **غیر محفوظ درخواست / Unsafe Request Blocked**:\n"
                        "Kisan Dost does NOT provide instructions for making homemade poisons, dangerous chemical "
                        "mixtures, or harmful substances from household materials. This is dangerous and illegal.\n\n"
                        "All pesticide recommendations come exclusively from officially registered commercial products "
                        "approved by the Department of Plant Protection, Government of Pakistan.\n\n"
                        "**To get a safe, verified pest management recommendation**, please describe the specific "
                        "symptoms you observe on your crop plants."
                    ),
                    non_chemical_management=[
                        "Use only officially registered pesticides from licensed agricultural dealers.",
                        "Consult your local Agriculture Extension Officer for safe, approved recommendations.",
                        "Never mix household chemicals — this is extremely dangerous and can be fatal.",
                    ],
                    safety_notes=[
                        "Homemade chemical mixtures are illegal, dangerous, and can cause serious injury or death.",
                        "Only use registered pesticides from licensed agricultural dealers.",
                        "Always follow the official registered product label for safe usage.",
                    ],
                    dosage_disclaimer=STANDARD_DOSAGE_DISCLAIMER,
                ),
                raw_user_symptoms=raw_symptoms,
            )

        if _matches_any(symptoms_lower, VAGUE_DOSAGE_PATTERNS):
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Guidance — Describe Crop Symptoms",
                    primary_diagnosis="Symptom Description Needed (علامات بیان کریں)",
                    primary_diagnosis_ur="براہ کرم فصل کی علامات بیان کریں",
                    symptom_analysis=(
                        "🔬 **علامات بیان کریں / Describe Crop Symptoms**:\n"
                        "You asked for a pesticide dosage, but to safely recommend the right chemical and dosage, "
                        "Kisan Dost first needs to know what specific pest or disease is affecting your crop.\n\n"
                        "**Dosages are NEVER invented or guessed** — they are prescribed from PARC and Punjab "
                        "Agriculture Extension verified records matched to your specific diagnosed problem.\n\n"
                        "**Please describe what you see:**\n"
                        "• Which part is affected: leaves, stem, bolls, roots, grains?\n"
                        "• What colour changes: yellow spots, brown patches, rust powder, black mold?\n"
                        "• Are there insects visible: small flies, caterpillars, aphids, mites under leaves?\n"
                        "• What damage: holes, curling, wilting, sticky honeydew, frass/sawdust?\n\n"
                        "Once symptoms are identified, a verified PARC-sourced treatment with correct dosage will be recommended."
                    ),
                    non_chemical_management=[
                        "Inspect crop carefully: look under leaves, on stems, and at soil near roots.",
                        "Describe exactly what you see — colour of spots, insect shape, damaged plant parts.",
                        "Take a close-up photograph of the affected area if possible.",
                        "Visit your nearest Agriculture Extension Office for on-site inspection.",
                    ],
                    safety_notes=[
                        "Never apply any pesticide without first identifying the correct pest or disease.",
                        "Wrong chemical choice wastes money, damages the crop, and harms the environment.",
                        "All dosages on Kisan Dost come from officially verified PARC and Punjab Agri Extension records.",
                        "Consult your local Agriculture Extension Officer for a confirmed diagnosis and registered product.",
                    ],
                    dosage_disclaimer=STANDARD_DOSAGE_DISCLAIMER,
                ),
                raw_user_symptoms=raw_symptoms,
            )

        # ── STEP 3: Classify agricultural intent ─────────────────────────────────
        from backend.app.guardrails.input_guardrails import InputGuardrail
        intent = InputGuardrail.classify_intent(raw_symptoms)

        if intent == "crop_advisor":
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Crop Advisory Redirect",
                    primary_diagnosis="Crop Selection Query — Use Crop Advisor (فصل انتخاب — مشیر سے رجوع کریں)",
                    primary_diagnosis_ur="فصل انتخاب کا سوال",
                    symptom_analysis=(
                        "🌱 **فصل مشورہ / Crop Advisor**:\n"
                        "Your question is about which crop to plant, not a pest or disease symptom. "
                        "For crop selection based on your district, soil, season, and water availability, "
                        "please use the **Crop Advisor** tool.\n\n"
                        "The Crop Advisor considers:\n"
                        "• District and provincial agro-climatic zone\n"
                        "• Current season (Kharif / Rabi)\n"
                        "• Soil type (Sandy Loam, Loam, Clay Loam)\n"
                        "• Water availability (Canal, Tube Well, Rain-fed)\n"
                        "• Expected profitability and market rates\n\n"
                        "**This Pest Doctor clinic** is for diagnosing crop pests and diseases once your crop is growing."
                    ),
                    non_chemical_management=[
                        "Use the Crop Advisor page to get a personalized crop recommendation for your district.",
                        "For Multan / South Punjab: Cotton (Apr–May), Wheat (Oct–Nov), and Maize are popular crops.",
                        "Consult your local Agriculture Extension Officer for district-specific sowing calendars.",
                    ],
                    safety_notes=[
                        "Match crop choice to your irrigation source — canal vs tube-well crops differ significantly.",
                        "Check PARC crop calendars for optimal sowing windows in your agro-climatic zone.",
                    ],
                    dosage_disclaimer=STANDARD_DOSAGE_DISCLAIMER,
                ),
                raw_user_symptoms=raw_symptoms,
            )

        if intent == "vague_request":
            return OutputSafetyValidator.validate_diagnosis(
                _make_guardrail_rejection(
                    category="Guidance — Describe Crop Symptoms",
                    primary_diagnosis="Symptom Description Needed (علامات بیان کریں)",
                    primary_diagnosis_ur="براہ کرم فصل کی علامات بیان کریں",
                    symptom_analysis=(
                        "🔬 **علامات بیان کریں / Describe Crop Symptoms**:\n"
                        "To run an accurate pest and disease diagnosis, please describe the specific symptoms "
                        "you observe on your crop. The more detail you provide, the more accurate the diagnosis.\n\n"
                        "**Good symptom description includes:**\n"
                        "• Which part is affected: leaves, stem, roots, bolls, grains?\n"
                        "• What colour changes: yellow, brown, black spots, rust-coloured powder?\n"
                        "• Are there insects visible: tiny white flies, caterpillars, aphids under leaves?\n"
                        "• What physical damage: holes, curling, wilting, drying, sticky substance?\n"
                        "• When did it start and how fast is it spreading?\n\n"
                        "**Example:** 'My cotton leaves are turning yellow with small brown spots, "
                        "and I can see tiny reddish mites on the underside of leaves.'"
                    ),
                    non_chemical_management=[
                        "Inspect your crop early morning when insects are most visible.",
                        "Check both upper and lower leaf surfaces for insects, eggs, or spotting.",
                        "Note which parts of the field are affected — border rows, low-lying areas, or widespread.",
                        "Take a clear photograph of the affected plant part if possible.",
                    ],
                    safety_notes=[
                        "Do not spray any pesticide without a proper diagnosis — wrong chemicals waste money and damage crops.",
                        "Consult your local Agriculture Extension Officer for on-site crop inspection.",
                    ],
                    dosage_disclaimer=STANDARD_DOSAGE_DISCLAIMER,
                ),
                raw_user_symptoms=raw_symptoms,
            )

        # ── STEP 4: Infer crop if not explicitly given ────────────────────────────
        crop = req.crop
        if not crop or crop.lower() in ["all", "all crops", "none", "field crop"]:
            if any(w in symptoms_lower for w in ["cotton", "kapas", "phutti", "boll"]):
                crop = "Cotton"
            elif any(w in symptoms_lower for w in ["wheat", "gandum", "gehun"]):
                crop = "Wheat"
            elif any(w in symptoms_lower for w in ["rice", "dhan", "chawal", "paddy"]):
                crop = "Rice"
            elif any(w in symptoms_lower for w in ["maize", "makai", "corn"]):
                crop = "Maize"
            elif any(w in symptoms_lower for w in ["tomato", "potato", "tamatar", "aaloo", "chilli", "mirch", "onion", "pyaz", "sabzi", "vegetable"]):
                crop = "Vegetables"
            else:
                crop = "Cotton"

        # ── STEP 5: Match symptoms against verified knowledge base ────────────────
        best_record, confidence, alternative_records = pest_service.find_match(crop, raw_symptoms)

        if not best_record:
            best_record = {
                "id": "general_crop_pest",
                "crop": crop or "Field Crop",
                "pest_name": "Unidentified Crop Pest / Stress",
                "pest_name_ur": "غیر شناخت شدہ زرعی مسئلہ",
                "scientific_name": "Unspecified",
                "category": "Field Observation Needed",
                "symptoms": [raw_symptoms],
                "symptoms_ur": [],
                "risk_factors": ["High moisture or weather stress"],
                "non_chemical_management": [
                    "Inspect under leaves during early morning",
                    "Take physical leaf samples to your local Agriculture Extension Office",
                ],
                "verified_treatment": {
                    "active_ingredient": "Consult local registered label",
                    "trade_names": [],
                    "has_verified_dosage": False,
                    "safe_dosage_per_acre": "Refer to registered bottle label",
                    "water_volume_liters_per_acre": 100,
                    "source": "Directorate of Pest Warning & Quality Control of Pesticides Punjab",
                },
                "safety_notes": ["Always wear PPE: gloves, mask, goggles."],
                "phi_days": 14,
            }
            confidence = "Tentative / Low"

        # ── STEP 6: Build deterministic base diagnosis ────────────────────────────
        deterministic_diag = pest_service.build_deterministic_diagnosis(
            req=req,
            best_record=best_record,
            confidence=confidence,
            alternative_records=alternative_records,
        )

        # Ensure standard safety notes are always present
        existing_notes_lower = " ".join(deterministic_diag.safety_notes).lower()
        for note in STANDARD_SAFETY_NOTES:
            key = note[:30].lower()
            if key not in existing_notes_lower:
                deterministic_diag.safety_notes.append(note)

        # ── STEP 7: Optional Gemini bilingual enhancement ─────────────────────────
        try:
            gemini_prompt = (
                f"Farmer inquiry from District {req.district or 'Multan'}:\n"
                f"Crop: {crop}\n"
                f"Acreage: {req.acres or 5.0} acres\n"
                f"Symptoms reported by farmer: '{raw_symptoms}'\n\n"
                f"Verified matched diagnosis: {deterministic_diag.primary_diagnosis} ({deterministic_diag.scientific_name})\n"
                f"Confidence level: {confidence}\n"
                f"Active ingredient: {deterministic_diag.verified_treatment.active_ingredient if deterministic_diag.verified_treatment else 'None'}\n"
                f"Verified dosage: {deterministic_diag.verified_treatment.safe_dosage_per_acre if deterministic_diag.verified_treatment else 'Label only'}\n"
                f"Non-chemical steps: {', '.join(deterministic_diag.non_chemical_management[:3])}\n\n"
                f"Provide a compassionate, expert diagnostic explanation in friendly Urdu/Roman Urdu and concise English bullet points. "
                f"Adhere strictly to verified facts. Never invent pesticide dosages."
            )

            llm_text = await gemini_service.generate_response(
                system_instruction=PEST_DOCTOR_SYSTEM_INSTRUCTION,
                user_prompt=gemini_prompt,
                structured_context=deterministic_diag.model_dump(),
            )

            if llm_text and len(llm_text.strip()) > 30:
                deterministic_diag.symptom_analysis = (
                    f"{deterministic_diag.symptom_analysis}\n\n"
                    f"🌾 **زرعی مشیر کی تفصیلی رہنمائی (Expert Agronomist Advice)**:\n{llm_text.strip()}"
                )
        except Exception as e:
            print(f"[PestDoctorAgent] Gemini enhancement bypassed: {e}")

        # ── STEP 8: Enforce strict Output Safety Validator ────────────────────────
        return OutputSafetyValidator.validate_diagnosis(
            diagnosis=deterministic_diag,
            raw_user_symptoms=raw_symptoms,
        )


pest_doctor_agent = PestDoctorAgent()

# Wrapper function to conform to TriageAgent expectations
async def handle_query(user_query: str, farmer_id: str) -> Dict:
    """Accept a raw user query string and farmer ID, construct a PestDiagnosisRequest,
    invoke the PestDoctorAgent, and return a standardized dict.
    """
    from backend.app.services.context_service import get_context
    from backend.app.models.schemas import PestDiagnosisRequest
    # Retrieve stored farmer context (may be empty dict)
    ctx = get_context(farmer_id)
    # Build request model. Use available context fields where possible.
    request = PestDiagnosisRequest(
        crop=ctx.get("current_crop") or "cotton",
        symptoms=user_query,
        district=ctx.get("district") or "Multan",
        acres=ctx.get("acreage") or ctx.get("land_acres") or 5.0,
    )
    diagnosis = await pest_doctor_agent.diagnose(request)
    # Return a simple dict compatible with other agents
    return {
        "agent": "pest_doctor",
        "category": diagnosis.category,
        "response": diagnosis.primary_diagnosis,
        "context": ctx,
    }

