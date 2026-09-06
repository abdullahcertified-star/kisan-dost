"""Input Guardrails for Kisan Dost.
Filters off-topic queries and intercepts human-medical inquiries.
Also detects:
- Jailbreak / prompt-injection attempts
- Vague non-symptom queries (no agricultural symptom described)
- Dangerous synthesis / chemical harm requests
- Crop advisor misdirections (reroute guidance)
"""
import re
from typing import Tuple, Optional


HUMAN_MEDICAL_KEYWORDS = [
    # English
    "fever", "headache", "stomach ache", "chest pain", "cancer", "diabetes",
    "blood pressure", "antibiotic", "panadol", "paracetamol", "disprin",
    "doctor prescription", "human disease", "child sick", "pregnancy",
    "medicine for me", "what medicine", "give me medicine", "i have pain",
    "my child", "meri bachi", "mera bacha", "bacha bimar",
    # Urdu / Roman Urdu
    "bukhar", "sar dard", "pet dard", "khansi", "hamal",
    "sugar ki bimari", "blood pressure ki dawa", "dawa batao",
    "بخار", "سر درد", "پیٹ درد", "کھانسی", "حمل", "شوگر کی بیماری", "بلڈ پریشر", "ڈاکٹر", "انسانی دوا", "گولی", "ٹیبلٹ",
]

FORBIDDEN_TOPICS = [
    "crypto", "bitcoin", "ethereum", "casino", "gambling", "poker",
    "crack software", "celebrity gossip", "political election votes",
    "porn", "bomb", "ammunition",
    "کرپٹو", "بٹ کوائن", "جوا", "سیاست", "الیکشن", "ووٹ",
]

GREETING_PATTERNS = [
    r"^(hi|hello|hey|salam|assalam|a\.o\.a|aoa|kia hal|kya haal|subah bakhair|shab bakhair)[\s!.]*$",
    r"^(السلام علیکم|سلام|آداب|کیا حال ہے|کیسے ہو|صبح بخیر)[\s!.]*$",
]

JAILBREAK_PATTERNS = [
    r"ignore\s+(all\s+|your\s+|previous\s+|prior\s+)*(safety|rules|guidelines|instructions|system|prompts?)",
    r"bypass\s+(all\s+|your\s+)?(safety|rules|filters|guardrails)",
    r"forget\s+(your\s+)?(instructions|rules|training|safety)",
    r"act\s+as\s+(if\s+you\s+have\s+no|without)\s+(restrictions|safety|rules)",
    r"pretend\s+(you\s+are|to\s+be)\s+(evil|unrestricted|uncensored)",
    r"disable\s+(your\s+)?(safety|filters|guardrails)",
    r"(you\s+are\s+now|act|operate)\s+(as\s+)?(unrestricted|uncensored|dan|jailbroken)",
    r"override\s+(safety|rules|guidelines)",
    r"(print|reveal|show|dump|leak|output)\s+(your\s+)?(api\s+keys?|secret|system\s+prompt)",
]

DANGEROUS_SYNTHESIS_PATTERNS = [
    r"poison\s+(pests?|insects?|bugs?)\s+(using|with|from)\s+(household|home|kitchen|bathroom)",
    r"poison\s+(using|with|from)\s+(household|home|kitchen|bathroom)",
    r"(household|home|kitchen|bathroom)\s+(chemical|ingredient)s?\s+(to\s+)?(kill|poison|spray)",
    r"make\s+(poison|toxic|lethal|deadly)\s+(spray|mixture|chemical)",
    r"homemade\s+(poison|pesticide|toxic|chemical)",
    r"how\s+to\s+(kill|harm)\s+(someone|people|humans)\s+(with|using)",
    r"chemical\s+(weapon|warfare|attack)",
    r"mix\s+(bleach|acid|ammonia)\s+(with|and)",
]

OVERDOSE_BYPASS_PATTERNS = [
    r"(recommend|give|spray|apply|use)\s+\d+x\s+(the\s+)?(normal|safe|standard|recommended)?\s*(dose|dosage)",
    r"(overdose|double|triple|\d+x)\s+(the\s+)?(dose|dosage|chemical|pesticide|spray)",
    r"ignore\s+(safe|safety|dosage)\s+limits?",
    r"bypass\s+(safe|safety|dosage)\s+limits?",
    r"(higher|highest|extreme|maximum)\s+dosage\s+(to\s+kill|than\s+recommended)",
    r"(spray|apply|use)\s+[1-9]\d{2,}\s*(ml|litres?|liters?|gm|grams?)\b",
    r"(spray|apply|use)\s+(too\s+much|excessive|extra|huge)\s+(pesticide|spray|chemical)",
    r"(اوور\s*ڈوز|زیادہ\s*سپرے|ڈبل\s*خوراک|ڈبل\s*سپرے|زیادہ\s*دوائی)",
]

VAGUE_DOSAGE_PATTERNS = [
    # Requests that are purely asking for a dosage number with no symptom context
    r"^give\s+me\s+(a\s+)?(pesticide|chemical|fungicide|herbicide|insecticide)?\s*dosage\.?$",
    r"^give\s+me\s+(an?\s+)?(extremely|very|high|large|maximum|max|huge)?\s*(high|large)?\s*(pesticide|chemical)?\s*dosage\.?$",
    r"^(just\s+)?give\s+me\s+(a\s+)?dosage\.?$",
    r"^what\s+is\s+the\s+(pesticide\s+)?dosage\.?$",
    r"^tell\s+me\s+(the\s+)?(pesticide\s+)?dosage\.?$",
    r"^(prescribe|recommend)\s+(any|a)\s+chemical\.?$",
]

CROP_ADVISOR_PATTERNS = [
    r"what\s+(should\s+i\s+)?(plant|grow|sow|cultivate)",
    r"which\s+(crop|fasal|seed)\s+(is\s+best|should\s+i|for)",
    r"best\s+crop\s+(for|in|to\s+grow)",
    r"what\s+crop\s+(to|can\s+i|should)",
    r"kya\s+lagaun", r"kya\s+boun", r"konsi\s+fasal",
    r"recommend\s+(a\s+)?crop",
]

AGRI_SYMPTOM_KEYWORDS = [
    # English signs
    "leaf", "leaves", "stem", "root", "boll", "flower", "fruit", "grain",
    "yellow", "brown", "black", "white", "curl", "wilt", "dry", "rot",
    "spot", "lesion", "sore", "blotch", "rust", "insect", "bug", "fly", "aphid",
    "caterpillar", "larva", "egg", "mite", "mold", "fungus", "blight", "blast",
    "honeydew", "sticky", "sooty", "frass", "webbing", "hole", "boring", "sucking", "chewing",
    "whitefly", "white insect", "white insects",
    # Roman Urdu signs
    "patta", "pattay", "tana", "jar", "ghunda", "phool", "phal", "dana",
    "peela", "bhura", "kala", "safed", "murra", "murjha", "sukha", "gal",
    "dhabba", "zang", "keera", "makkhi", "tela", "sundi", "anda", "chiggar",
    "phaptond", "jhulsa", "nuqsan",
    # Urdu script signs
    "پتے", "پتا", "پیلے", "پیلا", "سفید", "مکھی", "کیڑا", "کیڑے", "سنڈی",
    "تیلا", "جھلساؤ", "بیماری", "حملہ", "مروڑ", "فنگس", "داغ", "سوکھی", "سوراخ"
]

CROP_NAMES = [
    "cotton", "kapas", "wheat", "gandum", "rice", "chawal", "maize", "makai",
    "potato", "aloo", "tomato", "tamatar", "vegetable", "sabzi", "sugarcane", "kamad",
    "کپاس", "گندم", "چاول", "مکئی", "آلو", "ٹماٹر", "کماند", "سرسوں"
]

AGRI_KEYWORDS = [
    "crop", "fasal", "wheat", "gandum", "cotton", "kapas", "rice", "chawal",
    "maize", "makai", "sugarcane", "kamad", "mustard", "sarson", "fertilizer",
    "khad", "urea", "dap", "pest", "kera", "keera", "bimari", "disease",
    "whitefly", "sundi", "spray", "pesticide", "weather", "mosam", "mandi",
    "price", "rate", "bhao", "soil", "zameen", "irrigation", "pani",
    "kisan", "farmer", "acre", "khet", "tractor", "loan", "card", "subsidy",
    "فصل", "کھاد", "یوریا", "ڈی اے پی", "زرعی", "زمین", "پانی", "نہر", "ٹیوب ویل"
]


def _matches_any(text: str, patterns: list) -> bool:
    """Check if text matches any regex pattern in the list."""
    for p in patterns:
        if re.search(p, text, re.IGNORECASE):
            return True
    return False


def has_agricultural_symptoms(text: str) -> bool:
    """Returns True if text contains at least one recognizable crop symptom keyword."""
    text_lower = text.lower()
    return any(kw in text_lower for kw in AGRI_SYMPTOM_KEYWORDS)


class InputGuardrail:
    @staticmethod
    def validate_input(user_prompt: str) -> Tuple[bool, Optional[str]]:
        """
        Validate incoming user query.
        Returns:
            (is_valid: bool, rejection_message: Optional[str])
        """
        prompt_lower = user_prompt.strip().lower()

        # 1. Human Medical Queries
        for med in HUMAN_MEDICAL_KEYWORDS:
            if re.search(r'\b' + re.escape(med) + r'\b', prompt_lower):
                return False, (
                    "⚠️ **طبی انتباہ / Medical Notice**: Kisan Dost is an AI agronomy system for crops and agriculture only. "
                    "We cannot provide medical diagnosis or medication advice for humans. "
                    "Please consult a certified medical doctor or visit your nearest hospital immediately. "
                    "(کسان دوست صرف زرعی اور فصلوں کے مشورے کے لیے ہے۔ انسانی صحت یا دوائی کے لیے قریبی ڈاکٹر سے رجوع کریں۔)"
                )

        # 2. Jailbreak / Prompt Injection Attempts
        if _matches_any(prompt_lower, JAILBREAK_PATTERNS):
            return False, (
                "🛡️ **حفاظتی اصول / Safety Guardrail**: Kisan Dost follows strict verified agricultural guidelines at all times. "
                "Safety rules cannot be overridden, bypassed, or ignored. "
                "All recommendations are grounded in verified PARC and Punjab Agriculture Extension data only. "
                "Please describe the actual symptoms you observe on your crop. "
                "(تمام سفارشات پاکستانی زرعی تحقیقاتی ادارے کے تصدیق شدہ ڈیٹا پر مبنی ہیں اور ان میں کوئی تبدیلی ممکن نہیں۔)"
            )

        # 4. Dangerous Synthesis Attempts
        if _matches_any(prompt_lower, DANGEROUS_SYNTHESIS_PATTERNS):
            return False, (
                "⛔ **غیر محفوظ درخواست / Unsafe Request**: Kisan Dost does not provide instructions for making homemade "
                "poisons, dangerous chemical mixtures, or harmful substances. "
                "All pesticide recommendations are from officially registered products only. "
                "For registered pesticide recommendations, please describe the specific symptoms you observe on your crop. "
                "(گھریلو زہر یا خطرناک مرکبات بنانے کی ہدایات فراہم نہیں کی جاتی۔ صرف رجسٹرڈ زرعی ادویات کی سفارش کی جاتی ہے۔)"
            )

        # 5. Overdose / Dosage Bypass Attempts
        if _matches_any(prompt_lower, OVERDOSE_BYPASS_PATTERNS):
            return False, (
                "🚨 **حفاظتی انتباہ / Overdose Blocked**: Kisan Dost strictly prohibits pesticide overdosing and dosage bypass attempts. "
                "Applying excessive chemical doses scorches crops, poisons groundwater, causes pest resurgence, and violates agricultural safety regulations. "
                "All chemical applications must strictly adhere to officially approved label dosages and extension guidelines. "
                "(فصل پر کیڑے مار ادویات کی زائد خوراک یا اوور ڈوز کی اجازت نہیں ہے۔ اس سے فصل جھلسنے اور زہر پھیلنے کا شدید خطرہ ہوتا ہے۔)"
            )

        # 6. Forbidden Non-Agricultural Topics
        for forb in FORBIDDEN_TOPICS:
            if re.search(r'\b' + re.escape(forb) + r'\b', prompt_lower):
                return False, (
                    "⚠️ **غیر متعلقہ سوال / Off-Topic**: Kisan Dost is strictly focused on Pakistani agriculture, crop advice, "
                    "fertilizers, mandi rates, weather, and farmer schemes. "
                    "Please ask a farming or crop-related question. "
                    "(برائے مہربانی صرف زراعت، کھاد، فصلوں، منڈی ریٹس یا موسم سے متعلق سوال پوچھیں۔)"
                )

        # Prompt passes safety guardrail
        return True, None

    @staticmethod
    def classify_intent(user_prompt: str) -> str:
        """
        Classify the agricultural intent of the input.
        Returns: 'market' | 'finance' | 'crop_advisor' | 'pest_diagnosis' | 'general_agri' | 'vague_request'
        """
        prompt_lower = user_prompt.strip().lower()

        # 1. Tractor / Farm Machinery / Schemes & Subsidies / Finance intent
        if re.search(r"\b(tractor|tracktor|traktor|machinery|tubewell|solar|harvester|rotavator|leveler|ٹریکٹر|سولر|ٹیوب ویل)\b", prompt_lower) or \
           re.search(r"\b(scheme|schemes|subsid|subsidies|kisan card|loan|qarz|grant|support|سکیم|اسکیم|سبسڈی|قرض|امداد)\b", prompt_lower) or \
           re.search(r"\b(profit|revenue|margin|earnings?|how much profit|make profit|earn|income|net profit|munafa|aamdani|منافع|آمدن|بچت)\b", prompt_lower) or \
           "کسان کارڈ" in user_prompt or "گرین ٹریکٹر" in user_prompt:
            return "finance"

        # 2. Crop Mandi wholesale market intent (crop prices, mandi, rates)
        if re.search(r"\b(price|rate|rates|bhao|mandi|wholesale|قیمت|ریٹ|منڈی|بھاؤ)\b", prompt_lower):
            return "market"

        # 3. Crop advisor intent ("what should i plant", "pani kam hai, kya lagaoon?", "konsi fasal")
        if _matches_any(prompt_lower, CROP_ADVISOR_PATTERNS) or \
           "what should i plant" in prompt_lower or \
           "what to plant" in prompt_lower or \
           "kya lagaoon" in prompt_lower or \
           "kya lagaun" in prompt_lower or \
           "kya boun" in prompt_lower or \
           "konsi fasal" in prompt_lower or \
           "کیا لگاؤں" in user_prompt or \
           "کون سی فصل" in user_prompt:
            return "crop_advisor"

        # 4. Pest / disease diagnosis
        if has_agricultural_symptoms(prompt_lower):
            return "pest_diagnosis"

        # 5. Has some agri keywords (fertilizer, weather, zameen, acres, etc.) but no symptoms
        if any(kw in prompt_lower for kw in AGRI_KEYWORDS) or \
           any(kw in prompt_lower for kw in ["urea", "dap", "khad", "rain", "barish", "zameen", "acre", "acres", "multan"]):
            return "general_agri"

        # 6. Greeting intent
        if _matches_any(prompt_lower, GREETING_PATTERNS) or prompt_lower in ["hi", "hello", "hey", "salam", "aoa", "السلام علیکم"]:
            return "greeting"

        # 7. Gratitude & Courtesy intent ("thanks", "thank you", "shukriya", "jazakallah")
        if re.search(r"\b(thanks?|thank\s+you|thx|shukriya|shukria|jazak\s*allah|jazakallah|شکریہ|جزاک\s*اللہ|مہربانی)\b", prompt_lower):
            return "gratitude"

        # 8. Acknowledgement intent ("ok", "okay", "theek hai", "acha", "good", "great", "got it")
        if re.search(r"^(ok|okay|theek\s+hai|thik\s+hai|acha|achha|understood|samajh\s+gaya|got\s+it|good|great|ٹھیک\s*ہے|سمجھ\s*گیا)[\s!.]*$", prompt_lower):
            return "acknowledgement"

        # 9. Farewell / Goodbye intent ("bye", "bye bye", "goodbye", "allah hafiz", "khuda hafiz", "alvida")
        if re.search(r"\b(bye|goodbye|good\s+bye|cya|see\s+you|take\s+care|allah\s*hafiz|khuda\s*hafiz|rab\s*rakha|alvida|اللہ\s*حافظ|خدا\s*حافظ|الوداع|شب\s*بخیر)\b", prompt_lower):
            return "farewell"

        # 10. No agricultural context at all
        return "vague_request"
