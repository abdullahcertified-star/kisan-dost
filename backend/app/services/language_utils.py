"""Language utility functions for detecting English, Urdu (Arabic script), and Roman Urdu.
Also provides crop and agricultural term dictionaries ensuring strict correctness.
"""
import re
from typing import Tuple, Dict, Any

URDU_SCRIPT_PATTERN = re.compile(r"[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]")

# Roman Urdu markers
ROMAN_URDU_WORDS = {
    "mere", "paas", "mein", "zameen", "hai", "hain", "kya", "lagaoon", "lagaun",
    "boun", "pani", "paani", "kam", "zyada", "fasal", "gandum", "kapas", "chawal",
    "makai", "makki", "sarson", "chana", "kitni", "kitna", "urea", "dap", "khad",
    "chahiye", "rate", "bhao", "munafa", "qarz", "keera", "pattay", "patta", "safed",
    "makkhi", "sundi", "kisan", "dost", "ekad", "barish", "hogi", "batao", "bataiye"
}

# Crop name mappings: canonical English -> Urdu script & Roman Urdu
CROP_NAMES = {
    "wheat": {"en": "Wheat", "ur": "گندم", "roman": "Gandum"},
    "gandum": {"en": "Wheat", "ur": "گندم", "roman": "Gandum"},
    "cotton": {"en": "Cotton", "ur": "کپاس", "roman": "Kapas"},
    "kapas": {"en": "Cotton", "ur": "کپاس", "roman": "Kapas"},
    "rice": {"en": "Rice", "ur": "چاول", "roman": "Chawal"},
    "chawal": {"en": "Rice", "ur": "چاول", "roman": "Chawal"},
    "maize": {"en": "Maize", "ur": "مکئی", "roman": "Makai"},
    "makai": {"en": "Maize", "ur": "مکئی", "roman": "Makai"},
    "makki": {"en": "Maize", "ur": "مکئی", "roman": "Makai"},
    "mustard": {"en": "Mustard / Raya", "ur": "سرسوں / رایا", "roman": "Sarson"},
    "sarson": {"en": "Mustard", "ur": "سرسوں", "roman": "Sarson"},
    "chickpea": {"en": "Chickpea / Gram", "ur": "چنا", "roman": "Chana"},
    "chana": {"en": "Chickpea", "ur": "چنا", "roman": "Chana"},
    "sugarcane": {"en": "Sugarcane", "ur": "کماد / گنا", "roman": "Kamad / Ganna"},
    "kamad": {"en": "Sugarcane", "ur": "کماد", "roman": "Kamad"},
    "potato": {"en": "Potato", "ur": "آلو", "roman": "Aloo"},
    "aloo": {"en": "Potato", "ur": "آلو", "roman": "Aloo"},
}


def detect_language(text: str) -> str:
    """
    Detect whether text is:
    - 'urdu': contains significant Urdu/Arabic unicode script
    - 'roman_urdu': Latin characters with Roman Urdu phonetic keywords
    - 'english': default English text
    """
    if not text:
        return "english"

    # 1. Check for Urdu Arabic script
    urdu_chars = len(URDU_SCRIPT_PATTERN.findall(text))
    if urdu_chars >= 2 or (len(text.strip()) <= 5 and urdu_chars >= 1):
        return "urdu"

    # 2. Check for Roman Urdu
    words = set(re.findall(r"\b[a-zA-Z]+\b", text.lower()))
    roman_matches = words.intersection(ROMAN_URDU_WORDS)
    if len(roman_matches) >= 2 or (len(words) <= 4 and len(roman_matches) >= 1):
        return "roman_urdu"

    return "english"


def normalize_crop_name(name: str) -> Dict[str, str]:
    """Returns canonical name representation in English, Urdu, and Roman Urdu."""
    cleaned = name.strip().lower()
    return CROP_NAMES.get(cleaned, {"en": name.title(), "ur": name, "roman": name.title()})
