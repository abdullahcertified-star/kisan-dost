"""Pakistani Agricultural Knowledge Base, Datasets, and Lookups.
Grounded in Punjab Agriculture Department, AMIS Pakistan, and FAO data.
"""

# Major Pakistani Districts with Lat/Long for Open-Meteo Weather
DISTRICT_COORDINATES = {
    "multan": {"lat": 30.1575, "lon": 71.5249, "province": "Punjab"},
    "faisalabad": {"lat": 31.4504, "lon": 73.1350, "province": "Punjab"},
    "lahore": {"lat": 31.5204, "lon": 74.3587, "province": "Punjab"},
    "sargodha": {"lat": 32.0836, "lon": 72.6711, "province": "Punjab"},
    "bahawalpur": {"lat": 29.3544, "lon": 71.6911, "province": "Punjab"},
    "rahim yar khan": {"lat": 28.4195, "lon": 70.3026, "province": "Punjab"},
    "sahiwal": {"lat": 30.6682, "lon": 73.1114, "province": "Punjab"},
    "gujranwala": {"lat": 32.1877, "lon": 74.1945, "province": "Punjab"},
    "sheikhupura": {"lat": 31.7131, "lon": 73.9783, "province": "Punjab"},
    "kasur": {"lat": 31.1179, "lon": 74.4461, "province": "Punjab"},
    "jhang": {"lat": 31.2781, "lon": 72.3317, "province": "Punjab"},
    "okara": {"lat": 30.8081, "lon": 73.4458, "province": "Punjab"},
    "pakpattan": {"lat": 30.3410, "lon": 73.3866, "province": "Punjab"},
    "khanewal": {"lat": 30.3017, "lon": 71.9321, "province": "Punjab"},
    "vehari": {"lat": 30.0419, "lon": 72.3528, "province": "Punjab"},
    "muzaffargarh": {"lat": 30.0754, "lon": 71.1921, "province": "Punjab"},
    "d.g. khan": {"lat": 30.0489, "lon": 70.6455, "province": "Punjab"},
    "dg khan": {"lat": 30.0489, "lon": 70.6455, "province": "Punjab"},
    "rawalpindi": {"lat": 33.5651, "lon": 73.0169, "province": "Punjab"},
    "chakwal": {"lat": 32.9328, "lon": 72.8630, "province": "Punjab"},
    "hyderabad": {"lat": 25.3960, "lon": 68.3578, "province": "Sindh"},
    "sukkur": {"lat": 27.7052, "lon": 68.8574, "province": "Sindh"},
    "larkana": {"lat": 27.5570, "lon": 68.2028, "province": "Sindh"},
    "mirpur khas": {"lat": 25.5276, "lon": 69.0159, "province": "Sindh"},
    "nawabshah": {"lat": 26.2483, "lon": 68.4096, "province": "Sindh"},
    "peshawar": {"lat": 34.0151, "lon": 71.5249, "province": "KPK"},
    "mardan": {"lat": 34.1989, "lon": 72.0404, "province": "KPK"},
    "swat": {"lat": 35.2227, "lon": 72.4258, "province": "KPK"},
    "quetta": {"lat": 30.1798, "lon": 66.9750, "province": "Balochistan"},
}

# Pakistani Crops Catalog with NPK needs, Yields, and Costs
CROPS_CATALOG = {
    "wheat": {
        "name": "Wheat (گندم)",
        "season": "Rabi",
        "sowing_window": "November 01 to November 30",
        "harvesting_window": "April 15 to May 15",
        "ideal_soil": ["Loam (Mera)", "Clay Loam", "Sandy Loam"],
        "water_requirement": "Medium (3-4 irrigations)",
        "avg_yield_maunds_per_acre": 42.0,  # 1 maund = 40 kg
        "market_price_per_maund": 3900,     # PKR per 40kg
        "seed_rate_kg_per_acre": 50.0,
        "seed_cost_per_acre": 6000,
        "land_prep_cost_per_acre": 12000,
        "harvesting_cost_per_acre": 14000,
        "npk_requirement": {"N": 64.0, "P": 46.0, "K": 25.0}, # kg per acre
        "recommended_urea_bags": 2.5,
        "recommended_dap_bags": 1.0,
        "recommended_sop_bags": 0.5,
    },
    "cotton": {
        "name": "Cotton (کپاس)",
        "season": "Kharif",
        "sowing_window": "April 15 to May 31",
        "harvesting_window": "September 15 to November 30",
        "ideal_soil": ["Loam (Mera)", "Silt Loam"],
        "water_requirement": "High (5-6 irrigations)",
        "avg_yield_maunds_per_acre": 28.0,
        "market_price_per_maund": 8500,
        "seed_rate_kg_per_acre": 8.0,
        "seed_cost_per_acre": 8000,
        "land_prep_cost_per_acre": 15000,
        "harvesting_cost_per_acre": 18000,
        "npk_requirement": {"N": 70.0, "P": 35.0, "K": 30.0},
        "recommended_urea_bags": 3.0,
        "recommended_dap_bags": 1.0,
        "recommended_sop_bags": 0.5,
    },
    "rice": {
        "name": "Basmati Rice (چاول / دھان)",
        "season": "Kharif",
        "sowing_window": "May 20 to June 30",
        "harvesting_window": "October 15 to November 20",
        "ideal_soil": ["Clay Loam (Paki Mera)", "Clay"],
        "water_requirement": "Very High (Standing water)",
        "avg_yield_maunds_per_acre": 45.0,
        "market_price_per_maund": 4600,
        "seed_rate_kg_per_acre": 6.0,
        "seed_cost_per_acre": 4500,
        "land_prep_cost_per_acre": 18000,
        "harvesting_cost_per_acre": 15000,
        "npk_requirement": {"N": 55.0, "P": 35.0, "K": 25.0},
        "recommended_urea_bags": 2.2,
        "recommended_dap_bags": 1.0,
        "recommended_sop_bags": 0.5,
    },
    "maize": {
        "name": "Maize / Corn (مکئی)",
        "season": "Spring / Kharif",
        "sowing_window": "February 01 to March 15 / July 15 to August 15",
        "harvesting_window": "June / November",
        "ideal_soil": ["Deep Loam", "Sandy Loam"],
        "water_requirement": "High (6-8 irrigations)",
        "avg_yield_maunds_per_acre": 90.0,
        "market_price_per_maund": 2400,
        "seed_rate_kg_per_acre": 10.0,
        "seed_cost_per_acre": 16000,
        "land_prep_cost_per_acre": 14000,
        "harvesting_cost_per_acre": 16000,
        "npk_requirement": {"N": 92.0, "P": 46.0, "K": 50.0},
        "recommended_urea_bags": 4.0,
        "recommended_dap_bags": 1.5,
        "recommended_sop_bags": 1.0,
    },
    "sugarcane": {
        "name": "Sugarcane (کماد / گنا)",
        "season": "Annual / Spring",
        "sowing_window": "February 15 to March 31",
        "harvesting_window": "November to February",
        "ideal_soil": ["Heavy Loam", "Clay Loam"],
        "water_requirement": "Very High (16-20 irrigations)",
        "avg_yield_maunds_per_acre": 750.0,
        "market_price_per_maund": 450,
        "seed_rate_kg_per_acre": 3000.0,
        "seed_cost_per_acre": 35000,
        "land_prep_cost_per_acre": 25000,
        "harvesting_cost_per_acre": 40000,
        "npk_requirement": {"N": 100.0, "P": 50.0, "K": 50.0},
        "recommended_urea_bags": 4.5,
        "recommended_dap_bags": 1.5,
        "recommended_sop_bags": 1.0,
    },
    "mustard": {
        "name": "Mustard / Raya (سرسوں / کینولا)",
        "season": "Rabi",
        "sowing_window": "September 15 to October 31",
        "harvesting_window": "March 01 to March 31",
        "ideal_soil": ["Sandy Loam", "Loam"],
        "water_requirement": "Low (1-2 irrigations)",
        "avg_yield_maunds_per_acre": 22.0,
        "market_price_per_maund": 7500,
        "seed_rate_kg_per_acre": 2.5,
        "seed_cost_per_acre": 3000,
        "land_prep_cost_per_acre": 10000,
        "harvesting_cost_per_acre": 10000,
        "npk_requirement": {"N": 35.0, "P": 25.0, "K": 0.0},
        "recommended_urea_bags": 1.5,
        "recommended_dap_bags": 0.75,
        "recommended_sop_bags": 0.0,
    },
    "gram": {
        "name": "Chickpea / Gram (چنا)",
        "season": "Rabi",
        "sowing_window": "October 01 to November 15",
        "harvesting_window": "March 15 to April 15",
        "ideal_soil": ["Sandy Loam (Thal area)", "Loam"],
        "water_requirement": "Very Low (Barani / Rainfed or 1 irrigation)",
        "avg_yield_maunds_per_acre": 18.0,
        "market_price_per_maund": 8200,
        "seed_rate_kg_per_acre": 30.0,
        "seed_cost_per_acre": 9000,
        "land_prep_cost_per_acre": 8000,
        "harvesting_cost_per_acre": 8000,
        "npk_requirement": {"N": 10.0, "P": 25.0, "K": 0.0},
        "recommended_urea_bags": 0.5,
        "recommended_dap_bags": 0.5,
        "recommended_sop_bags": 0.0,
    },
}

# Current Fertilizer Standard Prices in Pakistan (PKR per 50kg bag)
FERTILIZER_PRICES_PKR = {
    "urea": 4600,   # Standard 50kg bag Urea
    "dap": 12800,   # Standard 50kg bag Di-Ammonium Phosphate
    "sop": 15500,   # Standard 50kg bag Sulphate of Potash
}

# Plant Pest & Disease Knowledge Base with STRICT Safety Dosages
PEST_DISEASE_DB = [
    {
        "id": "whitefly",
        "target_crops": ["cotton", "tomato", "chili", "okra"],
        "pest_name": "Whitefly (سفید مکھی / Bemisia tabaci)",
        "symptoms": ["cotton leaves curling", "tiny white insects", "sticky honeydew on leaf underside", "sooty mold", "yellowing leaves"],
        "chemical_treatment": "Diafenthiuron 500 SC or Pyriproxyfen 10.8 EC",
        "safe_dosage_ml_per_acre": 250.0,
        "max_safe_dosage_ml_per_acre": 300.0,  # Guardrail limit
        "water_volume_liters_per_acre": 100,
        "organic_treatment": "Neem seed extract 5% + yellow sticky cards (10/acre)",
        "safety_instructions": "Spray early morning or evening. Wear goggles, mask, and nitrile gloves. Do not harvest within 14 days of spray (PHI)."
    },
    {
        "id": "pink_bollworm",
        "target_crops": ["cotton"],
        "pest_name": "Pink Bollworm (گلابی سنڈی / Pectinophora gossypiella)",
        "symptoms": ["rosetted flowers", "boll holes", "premature boll opening", "stained cotton lint"],
        "chemical_treatment": "Chlorantraniliprole 20 SC or Spinetoram 11.7 SC",
        "safe_dosage_ml_per_acre": 60.0,
        "max_safe_dosage_ml_per_acre": 80.0,
        "water_volume_liters_per_acre": 120,
        "organic_treatment": "PB-Rope L pheromone traps (5-8 traps/acre) + Trichogramma cards",
        "safety_instructions": "Rotate chemical groups to prevent resistance. Wash equipment thoroughly after use away from water channels."
    },
    {
        "id": "wheat_rust",
        "target_crops": ["wheat"],
        "pest_name": "Wheat Stripe / Yellow Rust (گندم کی پیلی / بھوری کنگی)",
        "symptoms": ["yellow stripes on wheat leaves", "powdery orange-yellow pustules", "drying leaf tips"],
        "chemical_treatment": "Tebuconazole 250 EC or Propiconazole 25 EC",
        "safe_dosage_ml_per_acre": 200.0,
        "max_safe_dosage_ml_per_acre": 250.0,
        "water_volume_liters_per_acre": 100,
        "organic_treatment": "Ensure resistant seed varieties (e.g., Akbar-19, Dilkash-20, Subhani-21); avoid excess nitrogen.",
        "safety_instructions": "Avoid spraying in high wind. Ensure complete canopy coverage. Keep livestock away from sprayed fields for 10 days."
    },
    {
        "id": "rice_blast",
        "target_crops": ["rice"],
        "pest_name": "Rice Blast / Neck Blast (دھان کا جھلسائو / گردن توڑ)",
        "symptoms": ["diamond shaped lesions on leaves", "gray center with dark reddish border", "blackened neck of panicle"],
        "chemical_treatment": "Tricyclazole 75 WP or Kasugamycin 2% SL",
        "safe_dosage_ml_per_acre": 120.0,
        "max_safe_dosage_ml_per_acre": 150.0,
        "water_volume_liters_per_acre": 100,
        "organic_treatment": "Balanced fertilizer application (avoid excessive urea), seed treatment with bio-fungicide.",
        "safety_instructions": "Do not drain spray water directly into fish ponds or waterways. Wear rubber boots."
    },
    {
        "id": "aphid",
        "target_crops": ["wheat", "mustard", "vegetables"],
        "pest_name": "Aphid / Chepa (سست تیلا / چھیپا)",
        "symptoms": ["curling tender leaves", "honeydew secretion", "black sooty growth", "dense colonies of green/black insects on stems"],
        "chemical_treatment": "Imidacloprid 200 SL or Flonicamid 50 WG",
        "safe_dosage_ml_per_acre": 60.0,
        "max_safe_dosage_ml_per_acre": 80.0,
        "water_volume_liters_per_acre": 100,
        "organic_treatment": "Spray soapy water (10ml liquid soap per liter) or encourage ladybird beetles.",
        "safety_instructions": "Highly toxic to bees; NEVER spray during peak flowering time while honeybees are foraging."
    },
    {
        "id": "cotton_leaf_curl",
        "target_crops": ["cotton"],
        "pest_name": "Cotton Leaf Curl Virus - CLCuV (کپاس کے پتوں کا مڑائو وائرس)",
        "symptoms": ["upward or downward leaf curling", "thickened veins", "enations (small leaf-like growths) under leaf"],
        "chemical_treatment": "Viral disease transmitted by Whitefly; control vector using Pyriproxyfen 10.8 EC (250ml/acre) + Acetamiprid 20 SP (125g/acre)",
        "safe_dosage_ml_per_acre": 250.0,
        "max_safe_dosage_ml_per_acre": 300.0,
        "water_volume_liters_per_acre": 100,
        "organic_treatment": "Uproot infected plants early; plant CLCuV-tolerant approved BT varieties.",
        "safety_instructions": "Never apply chemicals to cure virus directly; target the vector safely."
    }
]

# Daily Mandi Rates (AMIS Punjab / Sindh Wholesale Benchmarks) per Maund (40 kg)
MANDI_PRICES = {
    "wheat": {
        "Multan": {"min": 3850, "max": 4050, "avg": 3950, "arrival_maunds": 15000},
        "Faisalabad": {"min": 3900, "max": 4100, "avg": 4000, "arrival_maunds": 22000},
        "Lahore": {"min": 3950, "max": 4200, "avg": 4080, "arrival_maunds": 30000},
        "Sargodha": {"min": 3800, "max": 4000, "avg": 3900, "arrival_maunds": 12000},
        "Hyderabad": {"min": 3900, "max": 4150, "avg": 4020, "arrival_maunds": 14000},
    },
    "cotton": {
        "Multan": {"min": 8200, "max": 8800, "avg": 8500, "arrival_maunds": 8000},
        "Bahawalpur": {"min": 8100, "max": 8700, "avg": 8450, "arrival_maunds": 9500},
        "Rahim Yar Khan": {"min": 8300, "max": 8900, "avg": 8600, "arrival_maunds": 11000},
        "Sukkur": {"min": 8000, "max": 8600, "avg": 8300, "arrival_maunds": 6500},
        "Hyderabad": {"min": 8150, "max": 8750, "avg": 8450, "arrival_maunds": 7200},
    },
    "rice": {
        "Lahore": {"min": 4400, "max": 4800, "avg": 4600, "arrival_maunds": 18000},
        "Gujranwala": {"min": 4500, "max": 4900, "avg": 4720, "arrival_maunds": 25000},
        "Sheikhupura": {"min": 4450, "max": 4850, "avg": 4680, "arrival_maunds": 20000},
        "Faisalabad": {"min": 4350, "max": 4750, "avg": 4550, "arrival_maunds": 12000},
    },
    "maize": {
        "Sahiwal": {"min": 2350, "max": 2550, "avg": 2450, "arrival_maunds": 28000},
        "Okara": {"min": 2400, "max": 2600, "avg": 2500, "arrival_maunds": 35000},
        "Pakpattan": {"min": 2300, "max": 2500, "avg": 2400, "arrival_maunds": 18000},
        "Faisalabad": {"min": 2380, "max": 2580, "avg": 2480, "arrival_maunds": 15000},
    },
    "mustard": {
        "Faisalabad": {"min": 7200, "max": 7800, "avg": 7500, "arrival_maunds": 4500},
        "Sargodha": {"min": 7100, "max": 7700, "avg": 7400, "arrival_maunds": 5200},
        "Multan": {"min": 7300, "max": 7900, "avg": 7600, "arrival_maunds": 3800},
    }
}

# Provincial & National Farmer Support Schemes
GOVT_SUPPORT_SCHEMES = [
    {
        "id": "kisan_card",
        "title": "CM Punjab Kisan Card (وزیراعلیٰ پنجاب کسان کارڈ)",
        "province": "Punjab",
        "eligibility": "Farmers owning up to 12.5 acres registered with Land Record Authority (PLRA).",
        "benefit": "Interest-free digital loan up to PKR 150,000 (PKR 30,000 per acre up to 5 acres) for purchasing Urea, DAP, and certified seeds through registered dealers.",
        "how_to_apply": "Send your CNIC to 8070 via SMS or visit the nearest Agriculture Extension Office / Bank of Punjab branch.",
        "urgency_note": "Applications open for current season."
    },
    {
        "id": "green_tractor",
        "title": "Punjab Green Tractor Scheme (گرین ٹریکٹر اسکیم)",
        "province": "Punjab",
        "eligibility": "Cultivators holding 1 to 50 acres of agricultural land in Punjab.",
        "benefit": "Subsidy of PKR 1,000,000 (10 Lakhs) per tractor for modern mechanized farming.",
        "how_to_apply": "Apply online at agripunjab.gov.pk or through the Punjab Agriculture Department portal.",
        "urgency_note": "Balloting system applies."
    },
    {
        "id": "solar_tubewell",
        "title": "Solarization of Agricultural Tubewells (شمسی ٹیوب ویل اسکیم)",
        "province": "Punjab & Sindh",
        "eligibility": "Farmers operating diesel or electric tubewells on land size 5-25 acres.",
        "benefit": "Up to 67%-80% government subsidy on converting conventional tubewells to solar PV arrays, drastically cutting diesel/electricity costs.",
        "how_to_apply": "Contact District Water Management Officer or On-Farm Water Management (OFWM) wing.",
        "urgency_note": "High fuel savings impact."
    },
    {
        "id": "ztbl_kissan_loan",
        "title": "ZTBL Production Loans (زرعی ترقیاتی بینک پیداواری قرضہ جات)",
        "province": "All Pakistan",
        "eligibility": "Smallholder farmers with verifiable Passbook or personal surety.",
        "benefit": "Subsidized mark-up seasonal crop loans for seeds, pesticides, fertilizers, and diesel.",
        "how_to_apply": "Visit nearest ZTBL branch with land ownership documents / Passbook.",
        "urgency_note": "Available year-round for Rabi & Kharif."
    }
]
