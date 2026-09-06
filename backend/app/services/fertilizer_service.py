"""Deterministic Fertilizer Calculation Service for Pakistani Agriculture.
Calculates crop-specific NPK nutrient requirements, converts them into standard 50kg bags
of DAP, Urea, and SOP, and computes estimated input costs.
Calculations are 100% deterministic based on Pakistani agronomic standards (PARC / Punjab Agri Dept).
Gemini LLM is strictly prohibited from altering the mathematical outputs.
"""
import json
import os
from typing import Dict, Any, Optional

from backend.app.models.schemas import FertilizerInput, FertilizerPlan, FertilizerProduct


class FertilizerService:
    _CATALOG_CACHE: Optional[Dict[str, Any]] = None

    @classmethod
    def _load_catalog(cls) -> Dict[str, Any]:
        """Loads and caches the configurable fertilizer catalog from JSON."""
        if cls._CATALOG_CACHE is not None:
            return cls._CATALOG_CACHE

        catalog_path = os.path.join(os.path.dirname(__file__), "..", "data", "fertilizer_catalog.json")
        try:
            with open(catalog_path, "r", encoding="utf-8") as f:
                cls._CATALOG_CACHE = json.load(f)
        except Exception as e:
            raise RuntimeError(f"Failed to load fertilizer catalog from {catalog_path}: {e}")

        return cls._CATALOG_CACHE

    @classmethod
    def reload_catalog(cls) -> None:
        """Force reloads catalog from disk (useful for tests or dynamic price updates)."""
        cls._CATALOG_CACHE = None
        cls._load_catalog()

    @classmethod
    def match_crop(cls, crop_query: str, catalog: Dict[str, Any]) -> Dict[str, Any]:
        """Fuzzy matches crop query against supported crops and their aliases."""
        clean = crop_query.strip().lower()
        crops = catalog.get("crops", {})

        for crop_id, data in crops.items():
            if clean == crop_id or clean in data.get("aliases", []):
                return data

        for crop_id, data in crops.items():
            for alias in data.get("aliases", []):
                if alias in clean or clean in alias:
                    return data

        raise ValueError(f"Crop '{crop_query}' is not supported. Supported crops: {', '.join(c.title() for c in crops.keys())}")

    @classmethod
    def match_soil_modifier(cls, soil_query: str, catalog: Dict[str, Any]) -> Dict[str, Any]:
        """Matches soil query to soil modifiers."""
        clean = soil_query.strip().lower()
        modifiers = catalog.get("soil_modifiers", {})

        for mod_id, data in modifiers.items():
            for alias in data.get("aliases", []):
                if alias in clean or clean in alias:
                    return data

        # Default to benchmark Loam
        return modifiers.get("loam", {
            "n_factor": 1.0,
            "p_factor": 1.0,
            "k_factor": 1.0,
            "notes_en": "Standard balanced loam soil.",
            "notes_ur": "معیاری زرخیز میرا مٹی۔"
        })

    @classmethod
    def calculate(cls, input_data: FertilizerInput) -> FertilizerPlan:
        """
        Pure deterministic calculation of fertilizer requirements:
        1. Base NPK lookup per crop.
        2. Soil texture adjustments.
        3. Target yield scaling (if provided).
        4. Conversion of P to DAP bags (23kg P2O5 per 50kg bag).
        5. Accounting for Nitrogen contributed by DAP (9kg N per bag).
        6. Conversion of remaining N to Urea bags (23kg N per 50kg bag).
        7. Conversion of K to SOP bags (25kg K2O per 50kg bag).
        8. Cost calculation using configurable catalog prices.
        """
        if input_data.acres <= 0.0:
            raise ValueError("Acres must be greater than 0")

        catalog = cls._load_catalog()
        crop_data = cls.match_crop(input_data.crop, catalog)
        soil_mod = cls.match_soil_modifier(input_data.soil_type, catalog)
        products = catalog.get("products", {})

        acres = float(input_data.acres)
        base_n = crop_data["base_n_kg_per_acre"]
        base_p = crop_data["base_p_kg_per_acre"]
        base_k = crop_data["base_k_kg_per_acre"]
        benchmark_yield = crop_data.get("benchmark_yield_maunds_per_acre", 40.0)

        # 1. Target Yield Scaling Factor
        yield_factor = 1.0
        if input_data.target_yield and input_data.target_yield > 0:
            ratio = input_data.target_yield / benchmark_yield
            # Biological bounding: 0.6x to 1.5x
            yield_factor = max(0.6, min(1.5, ratio))

        # 2. Total NPK Nutrient Requirements (kg)
        n_req = round(base_n * acres * soil_mod["n_factor"] * yield_factor, 1)
        p_req = round(base_p * acres * soil_mod["p_factor"] * yield_factor, 1)
        k_req = round(base_k * acres * soil_mod["k_factor"] * yield_factor, 1)

        # 3. Product Stoichiometry
        dap_info = products.get("dap", {"n_kg_per_bag": 9.0, "p_kg_per_bag": 23.0, "estimated_price_pkr": 12800})
        urea_info = products.get("urea", {"n_kg_per_bag": 23.0, "estimated_price_pkr": 4600})
        sop_info = products.get("sop", {"k_kg_per_bag": 25.0, "estimated_price_pkr": 14500})

        # Step 4a: DAP bags needed to satisfy Phosphorus
        p_per_dap = dap_info.get("p_kg_per_bag", 23.0)
        dap_bags = round(p_req / p_per_dap, 1) if p_req > 0 else 0.0

        # Step 4b: Nitrogen supplied by DAP
        n_from_dap = round(dap_bags * dap_info.get("n_kg_per_bag", 9.0), 1)

        # Step 4c: Remaining Nitrogen supplied by Urea
        remaining_n = max(0.0, n_req - n_from_dap)
        n_per_urea = urea_info.get("n_kg_per_bag", 23.0)
        urea_bags = round(remaining_n / n_per_urea, 1) if remaining_n > 0 else 0.0

        # Step 4d: Potassium satisfied by SOP
        k_per_sop = sop_info.get("k_kg_per_bag", 25.0)
        sop_bags = round(k_req / k_per_sop, 1) if k_req > 0 else 0.0

        # 5. Product Costs (using configurable prices marked as estimates)
        dap_unit_price = int(dap_info.get("estimated_price_pkr", 12800))
        urea_unit_price = int(urea_info.get("estimated_price_pkr", 4600))
        sop_unit_price = int(sop_info.get("estimated_price_pkr", 14500))

        dap_cost = int(round(dap_bags * dap_unit_price))
        urea_cost = int(round(urea_bags * urea_unit_price))
        sop_cost = int(round(sop_bags * sop_unit_price))
        total_cost = dap_cost + urea_cost + sop_cost

        # 6. Structured Product Breakdown
        product_list = [
            FertilizerProduct(
                product_id="dap",
                product_name_en=dap_info.get("name_en", "DAP"),
                product_name_ur=dap_info.get("name_ur", "ڈی اے پی"),
                bag_size_kg=dap_info.get("bag_size_kg", 50.0),
                bags_count=dap_bags,
                unit_price_pkr=dap_unit_price,
                total_cost_pkr=dap_cost,
                is_price_estimate=True,
                nutrients_contributed_kg={
                    "N": n_from_dap,
                    "P": round(dap_bags * p_per_dap, 1),
                    "K": 0.0
                },
                application_timing=dap_info.get("timing", "At sowing")
            ),
            FertilizerProduct(
                product_id="urea",
                product_name_en=urea_info.get("name_en", "Urea"),
                product_name_ur=urea_info.get("name_ur", "یوریا"),
                bag_size_kg=urea_info.get("bag_size_kg", 50.0),
                bags_count=urea_bags,
                unit_price_pkr=urea_unit_price,
                total_cost_pkr=urea_cost,
                is_price_estimate=True,
                nutrients_contributed_kg={
                    "N": round(urea_bags * n_per_urea, 1),
                    "P": 0.0,
                    "K": 0.0
                },
                application_timing=urea_info.get("timing", "Split across irrigations")
            )
        ]

        if sop_bags > 0:
            product_list.append(
                FertilizerProduct(
                    product_id="sop",
                    product_name_en=sop_info.get("name_en", "SOP (Potash)"),
                    product_name_ur=sop_info.get("name_ur", "ایس او پی (پوٹاش)"),
                    bag_size_kg=sop_info.get("bag_size_kg", 50.0),
                    bags_count=sop_bags,
                    unit_price_pkr=sop_unit_price,
                    total_cost_pkr=sop_cost,
                    is_price_estimate=True,
                    nutrients_contributed_kg={
                        "N": 0.0,
                        "P": 0.0,
                        "K": round(sop_bags * k_per_sop, 1)
                    },
                    application_timing=sop_info.get("timing", "At sowing or 1st irrigation")
                )
            )

        # 7. Application Schedule (English and Urdu)
        schedule_en = []
        schedule_ur = []
        schedule_bilingual = []

        # Step 1: Basal / At Sowing
        step1_en = (
            f"At Sowing / Basal: Apply full DAP ({dap_bags} bags) "
            + (f"and full SOP ({sop_bags} bags) " if sop_bags > 0 else "")
            + "during final seedbed preparation and incorporate thoroughly into the soil."
        )
        step1_ur = (
            f"بجائی کے وقت: تمام ڈی اے پی ({dap_bags} بوری) "
            + (f"اور تمام پوٹاش ایس او پی ({sop_bags} بوری) " if sop_bags > 0 else "")
            + "آخری ہل چلا کر مٹی میں اچھی طرح ملائیں۔"
        )
        schedule_en.append(step1_en)
        schedule_ur.append(step1_ur)
        schedule_bilingual.append(f"At Sowing / Basal (بجائی کے وقت): {step1_en}")

        if urea_bags > 0:
            first_split = round(urea_bags * 0.5, 1)
            second_split = round(urea_bags - first_split, 1)

            # Step 2: 1st Irrigation
            step2_en = (
                f"First Irrigation (21-25 DAS): Broadcast ~{first_split} bags of Urea "
                "with the 1st irrigation water."
            )
            step2_ur = (
                f"پہلا پانی (21 تا 25 دن): تقریباً {first_split} بوری یوریا "
                "پہلے پانی پر تر وتر یا پانی کے آگے چھٹہ کریں۔"
            )
            schedule_en.append(step2_en)
            schedule_ur.append(step2_ur)
            schedule_bilingual.append(f"First Irrigation (پہلا پانی): {step2_en}")

            if second_split > 0:
                # Step 3: Tillering / Vegetative
                step3_en = (
                    f"Second Irrigation / Tillering: Broadcast remaining ~{second_split} bags of Urea "
                    "with the 2nd irrigation before booting/flowering stage."
                )
                step3_ur = (
                    f"دوسرا پانی / شگوفے: بقیہ {second_split} بوری یوریا "
                    "دوسرے پانی پر مکمل کریں (پھول آنے سے قبل نائٹروجن مکمل کریں)۔"
                )
                schedule_en.append(step3_en)
                schedule_ur.append(step3_ur)
                schedule_bilingual.append(f"Second Irrigation / Tillering (دوسرا پانی): {step3_en}")

        advice_ur = f"{crop_data.get('agronomic_notes_ur', '')} {soil_mod.get('notes_ur', '')}"
        advice_en = f"{crop_data.get('agronomic_notes_en', '')} {soil_mod.get('notes_en', '')}"

        return FertilizerPlan(
            crop=crop_data.get("name_en", input_data.crop),
            crop_ur=crop_data.get("name_ur", input_data.crop),
            acres=acres,
            soil_type=input_data.soil_type,
            target_yield=input_data.target_yield,
            benchmark_yield=benchmark_yield,
            nitrogen_requirement_kg=n_req,
            phosphorus_requirement_kg=p_req,
            potassium_requirement_kg=k_req,
            dap_bags=dap_bags,
            urea_bags=urea_bags,
            sop_bags=sop_bags,
            urea_cost_pkr=urea_cost,
            dap_cost_pkr=dap_cost,
            sop_cost_pkr=sop_cost,
            total_cost_pkr=total_cost,
            estimated_total_cost_pkr=total_cost,
            is_price_estimate=True,
            price_disclaimer="نرخ مارکیٹ کے تخمینہ پر مبنی ہیں اور سیزنل طلب کے مطابق تبدیل ہو سکتے ہیں۔ (Market retail estimate)",
            products=product_list,
            npk_kg_applied={"N": n_req, "P": p_req, "K": k_req},
            application_schedule=schedule_bilingual,
            application_schedule_en=schedule_en,
            application_schedule_ur=schedule_ur,
            agronomic_advice_urdu=advice_ur.strip(),
            agronomic_advice_english=advice_en.strip(),
            safety_notice="یہ منصوبہ خالصتاً غذائی عناصر (NPK) پر مبنی ہے۔ کسی غیر مصدقہ زہر یا کیمیکل کا استعمال نہ کریں۔"
        )
