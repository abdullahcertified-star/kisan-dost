"""Structured database of verified Pakistani government agricultural support schemes.
All information is grounded in official provincial and federal agricultural departments.
If official live API data is unavailable, information is clearly marked as reference
information with its official gazette/extension source and verification date.
"""
from typing import List, Dict, Any, Optional

GOVERNMENT_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "punjab-kisan-card",
        "name": "CM Punjab Kisan Card Scheme",
        "name_ur": "وزیر اعلیٰ پنجاب کسان کارڈ اسکیم",
        "province": "Punjab",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Smallholders cultivating up to 12.5 acres",
            "Owner-cultivators registered with PLRA",
            "Tenants with verified cultivation records"
        ],
        "applicable_crops": ["Wheat", "Cotton", "Rice", "Maize", "Oilseeds", "All Major Crops"],
        "benefits": "Interest-free production loan of PKR 150,000 per crop season (PKR 30,000/acre up to 5 acres) disbursed via Bank of Punjab for purchasing DAP, Urea, and certified seeds from registered dealers.",
        "benefits_ur": "فی فصل ڈیڑھ لاکھ روپے (150,000 روپے) تک بلا سود زرعی قرضہ برائے کھاد اور بیج۔ فی ایکڑ 30,000 روپے تا 5 ایکڑ۔",
        "requirements": [
            "Valid Computerized National Identity Card (CNIC)",
            "Active mobile SIM registered in applicant's own CNIC",
            "Land ownership record verified via Punjab Land Records Authority (PLRA)",
            "Clean credit history (no default on prior Zarai Taraqiati Bank or commercial loans)"
        ],
        "requirements_ur": [
            "قومی شناختی کارڈ (CNIC)",
            "درخواست گزار کے نام پر رجسٹرڈ موبائل سم",
            "اراضی ریکارڈ سنٹر (PLRA) سے تصدیق شدہ فرد ملکیت",
            "کسی بھی بینک کا نادہندہ نہ ہونا"
        ],
        "how_to_apply": "Send your CNIC number (without dashes) via SMS to 8583 from your own registered SIM, or visit your nearest Bank of Punjab (BOP) branch or Tehsil Agriculture Extension Office.",
        "source": "Government of Punjab Agriculture Department & Bank of Punjab",
        "source_url": "https://agripunjab.gov.pk/kisan-card",
        "last_verified_date": "2026-02-15",
        "is_reference": True,
        "helpline": "0800-17000 / 042-111-267-200"
    },
    {
        "id": "green-tractor-subsidy",
        "name": "Chief Minister Green Tractor Scheme",
        "name_ur": "وزیر اعلیٰ گرین ٹریکٹر اسکیم",
        "province": "Punjab",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Farmers owning between 1 and 50 acres of agricultural land in Punjab"
        ],
        "applicable_crops": ["All field crops"],
        "benefits": "Flat non-refundable cash subsidy of PKR 1,000,000 (10 Lakh Rupees) directly discounted on the purchase of locally manufactured tractors ranging from 50 HP to 85 HP (Millat/Massey Ferguson, Al-Ghazi/New Holland).",
        "benefits_ur": "50 تا 85 ہارس پاور کے مقامی ٹریکٹر کی خریداری پر حکومت کی طرف سے 10 لاکھ روپے کی نقد سبسڈی۔",
        "requirements": [
            "Ownership of 1 to 50 acres verified through PLRA computerized land record",
            "Punjab domicile certificate and valid CNIC",
            "Applicant must not have won or benefited from any subsidized tractor scheme in the preceding 3 years"
        ],
        "requirements_ur": [
            "پنجاب میں 1 تا 50 ایکڑ اراضی کی تصدیق شدہ فرد ملکیت",
            "پنجاب کا ڈومیسائل اور قومی شناختی کارڈ",
            "گزشتہ 3 سال میں کسی ٹریکٹر اسکیم سے فائدہ نہ اٹھایا ہو"
        ],
        "how_to_apply": "Apply online through the official Punjab Green Tractor Portal (gts.punjab.gov.pk) or through the Directorate General of Agriculture (Field) Punjab.",
        "source": "Directorate General of Agriculture (Field), Punjab Agriculture Department",
        "source_url": "https://gts.punjab.gov.pk",
        "last_verified_date": "2026-02-01",
        "is_reference": True,
        "helpline": "0800-17000"
    },
    {
        "id": "solar-tubewell-subsidy",
        "name": "Chief Minister Solarization of Agricultural Tubewells",
        "name_ur": "زرعی ٹیوب ویلوں کی سولرائزیشن اسکیم",
        "province": "Punjab",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Farmers operating existing diesel or electric tubewells with landholding up to 25 acres"
        ],
        "applicable_crops": ["All irrigated crops", "Cotton", "Wheat", "Rice", "Sugarcane", "Orchards"],
        "benefits": "67% financial subsidy provided by the Punjab Government on complete solar pumping systems (farmer pays only 33% equity share). Dramatic reduction in diesel and grid electricity irrigation expenses.",
        "benefits_ur": "سولر ٹیوب ویل سسٹم کی تنصیب پر 67 فیصد سرکاری سبسڈی (کسان کا حصہ صرف 33 فیصد)۔ ڈیزل اور بجلی کے اخراجات میں بھاری کمی۔",
        "requirements": [
            "Functional tube-well with minimum 4-inch delivery pipe",
            "Land ownership up to 25 acres verified through PLRA",
            "Water table depth and water quality suitability clearance report by On-Farm Water Management"
        ],
        "requirements_ur": [
            "فعال ٹیوب ویل (کم از کم 4 انچ ڈلیوری پائپ)",
            "25 ایکڑ تک اراضی کی تصدیق شدہ فرد",
            "آن فارم واٹر مینجمنٹ سے پانی کے معیار اور گہرائی کی رپورٹ"
        ],
        "how_to_apply": "Submit application form at the office of the Deputy Director of Agriculture (On-Farm Water Management) in your district.",
        "source": "Directorate General Agriculture (Water Management) Punjab",
        "source_url": "https://ofwm.agripunjab.gov.pk",
        "last_verified_date": "2026-01-20",
        "is_reference": True,
        "helpline": "0800-17000"
    },
    {
        "id": "national-oilseeds-enhancement",
        "name": "National Oilseed Enhancement Program (NOEP)",
        "name_ur": "قومی منصوبہ برائے فروغ تلسی و روغن دار اجناس",
        "province": "All",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Farmers dedicating at least 1 acre to registered oilseed crops"
        ],
        "applicable_crops": ["Canola", "Sunflower", "Sesame (Til)", "Raya", "Mustard (Sarson)"],
        "benefits": "Direct subsidy voucher of PKR 5,000 per acre on certified hybrid seed, PKR 2,000 per bag subsidy on phosphatic fertilizer, and guaranteed minimum procurement support price.",
        "benefits_ur": "روغن دار اجناس کے تصدیق شدہ بیج پر 5,000 روپے فی ایکڑ سبسڈی، فاسفورسی کھاد پر 2,000 روپے فی بوری رعایت اور یقینی خریداری۔",
        "requirements": [
            "Cultivation of oilseeds on minimum 1 acre",
            "Physical verification of crop emergence by Field Assistant / Agriculture Extension officer",
            "Purchase of certified seed bag containing official scratch coupon"
        ],
        "requirements_ur": [
            "کم از کم 1 ایکڑ رقبے پر تل، کینولا یا سرسوں کی کاشت",
            "محکمہ زراعت توسیع کے فیلڈ اسسٹنٹ سے فصل کی تصدیق",
            "سبسڈی واؤچر والا تصدیق شدہ بیج کا تھیلا"
        ],
        "how_to_apply": "Send scratch voucher code found inside certified seed bag along with CNIC via SMS to 8070 to receive subsidy payment via mobile wallet.",
        "source": "Pakistan Agricultural Research Council (PARC) & Ministry of National Food Security & Research",
        "source_url": "http://www.parc.gov.pk/noep",
        "last_verified_date": "2025-11-20",
        "is_reference": True,
        "helpline": "051-9203966"
    },
    {
        "id": "sindh-hari-card",
        "name": "Sindh Hari Card Program",
        "name_ur": "سندھ ہاری کارڈ پروگرام",
        "province": "Sindh",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Registered Haris (tenants), small peasant farmers, and landowners possessing up to 16 acres in Sindh"
        ],
        "applicable_crops": ["Rice", "Wheat", "Cotton", "Sugarcane"],
        "benefits": "Direct targeted financial transfers for certified seeds, subsidized fertilizers, flood rehabilitation support, and crop insurance coverage.",
        "benefits_ur": "بیج اور کھاد کی خریداری کے لیے براہ راست مالی امداد، سیلاب سے متاثرہ کسانوں کی بحالی اور فصلوں کی بیمہ کاری۔",
        "requirements": [
            "Registration in Sindh Hari Registry Database",
            "Valid CNIC with permanent address in Sindh",
            "Verification of land/tenancy by local Revenue Department (Mukhtiarkar / Tapedar)"
        ],
        "requirements_ur": [
            "سندھ ہاری ڈیٹا بیس میں اندراج",
            "سندھ کے مستقل پتے والا شناختی کارڈ",
            "مختیار کار یا تپیدار سے کاشتکاری کی تصدیق"
        ],
        "how_to_apply": "Register at your nearest Sindh Agriculture Extension or Revenue Office with your CNIC and Form-VII land/tenant record.",
        "source": "Agriculture, Supply & Prices Department, Government of Sindh",
        "source_url": "https://sindh.gov.pk/agriculture",
        "last_verified_date": "2025-12-10",
        "is_reference": True,
        "helpline": "021-99211434"
    },
    {
        "id": "kp-kisan-card",
        "name": "Khyber Pakhtunkhwa Kisan Card Initiative",
        "name_ur": "خیبر پختونخوا کسان کارڈ اسکیم",
        "province": "Khyber Pakhtunkhwa",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Registered farmers in KP cultivating up to 12.5 acres"
        ],
        "applicable_crops": ["Wheat", "Maize", "Tobacco", "Vegetables", "Fruits"],
        "benefits": "Subsidized certified seeds, digital fertilizer vouchers, farm machinery rental concessions, and fast-track interest-free micro-credit loans up to PKR 100,000.",
        "benefits_ur": "تصدیق شدہ بیجوں اور کھاد پر ڈائریکٹ سبسڈی واؤچرز، زرعی مشینری پر رعایت اور ایک لاکھ روپے تک بلا سود قرضہ۔",
        "requirements": [
            "Computerized agricultural land verification in KP",
            "Biometric registration at designated Agriculture Extension centers",
            "Valid CNIC"
        ],
        "requirements_ur": [
            "کے پی میں زرعی اراضی کا تصدیق شدہ ریکارڈ",
            "محکمہ زراعت کے مرکز پر بائیو میٹرک تصدیق",
            "قومی شناختی کارڈ"
        ],
        "how_to_apply": "Visit your District Director of Agriculture Extension office with land records and CNIC for biometric enrollment.",
        "source": "Agriculture, Livestock, Fisheries & Cooperatives Department KP",
        "source_url": "https://agriculture.kp.gov.pk",
        "last_verified_date": "2025-10-30",
        "is_reference": True,
        "helpline": "091-9210200"
    },
    {
        "id": "sbp-kamyab-kisan-loan",
        "name": "Prime Minister's Kamyab Kisan Agri Youth Loan",
        "name_ur": "وزیر اعظم کامیاب کسان و یوتھ زرعی قرضہ اسکیم",
        "province": "All",
        "districts": ["All"],
        "eligible_farmer_types": [
            "Pakistani youth and farmers aged 21 to 45 years",
            "Smallholder farmers seeking capital expenditure or crop input financing"
        ],
        "applicable_crops": ["All crops", "Orchards", "Tunnel Farming", "Livestock"],
        "benefits": "Tier-1: 100% interest-free clean loan up to PKR 500,000 (no collateral required, only personal guarantee). Tier-2: Subsidized 5% markup loan up to PKR 1,500,000 for purchasing farm machinery or setting up modern drip/sprinkler systems.",
        "benefits_ur": "ٹائر 1: پانچ لاکھ روپے (500,000 روپے) تک مکمل بلا سود قرضہ بغیر ضمانت۔ ٹائر 2: پندرہ لاکھ روپے تک 5 فیصد رعایتی شرح پر زرعی مشینری قرضہ۔",
        "requirements": [
            "Valid CNIC and age between 21 and 45 years",
            "Viable agricultural or crop cultivation plan",
            "Two personal guarantees for Tier-1 financing"
        ],
        "requirements_ur": [
            "شناختی کارڈ اور عمر 21 تا 45 سال",
            "زرعی کاشتکاری یا مشینری کا قابل عمل منصوبہ",
            "ٹائر 1 کے لیے دو ذاتی ضمانتیں"
        ],
        "how_to_apply": "Apply directly online via the Prime Minister's Youth Program portal (pmyp.gov.pk) or through designated participating banks (ZTBL, NBP, BOP, Bank of Khyber).",
        "source": "State Bank of Pakistan (SBP) & Prime Minister's Youth Program",
        "source_url": "https://pmyp.gov.pk",
        "last_verified_date": "2026-01-15",
        "is_reference": True,
        "helpline": "051-9207000"
    }
]
