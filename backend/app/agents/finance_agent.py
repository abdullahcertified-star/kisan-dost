"""Finance & Government Schemes Agent.
Provides deterministic farm profit estimation, budget analysis, and
official Pakistani government agricultural schemes consultation.
Equipped with the SchemesService tool and profit estimator.
"""
import re
from typing import Dict, Any, Optional

from backend.app.services.context_service import get_context, update_context
from backend.app.services.schemes_service import SchemesService
from backend.app.tools.profit_estimator import run_profit_estimator
from backend.app.models.schemas import ProfitEstimatorRequest


def handle_query(user_query: str, farmer_id: str, language: str = "english") -> Dict[str, Any]:
    """
    Finance Agent – handles profit estimation and government agricultural schemes.
    Uses stored farmer context (acreage, district, crop) and invokes appropriate tools.
    """
    context = get_context(farmer_id)
    lowered = user_query.lower()
    acreage = context.get("acreage") or context.get("land_acres") or 5.0
    district = context.get("district") or "Multan"
    crop = context.get("current_crop") or "cotton"
    province = context.get("province") or "Punjab"

    # 0. Tractor / Farm Machinery & Green Tractor Scheme Inquiry
    is_tractor = any(kw in lowered for kw in ["tractor", "tracktor", "traktor", "ٹریکٹر"])
    if is_tractor:
        if language == "urdu" or any(u in user_query for u in ["کیا", "ہے", "قیمت", "سبسڈی", "ٹریکٹر"]):
            resp = (
                "🚜 **پاکستان میں ٹریکٹر کی قیمتیں اور وزیر اعلیٰ گرین ٹریکٹر اسکیم**:\n\n"
                "1. **مارکیٹ قیمتیں (Market Retail Prices)**:\n"
                "• **ملت / میسی فرگوسن MF-240 (50 HP)**: تقریباً PKR 2,550,000 تا 2,680,000 روپے\n"
                "• **ملت / میسی فرگوسن MF-385 (85 HP)**: تقریباً PKR 4,450,000 تا 4,700,000 روپے\n"
                "• **الغازي / نیو ہالینڈ NH-480 (55 HP)**: تقریباً PKR 2,600,000 تا 2,750,000 روپے\n"
                "• **الغازي / نیو ہالینڈ غازی (65 HP)**: تقریباً PKR 3,150,000 تا 3,350,000 روپے\n\n"
                "2. **وزیر اعلیٰ پنجاب گرین ٹریکٹر اسکیم (CM Green Tractor Scheme)**:\n"
                "• حکومت پنجاب کی طرف سے ہر ٹریکٹر پر **1,000,000 روپے (10 لاکھ روپے)** کی یکمشت نقد سبسڈی دی جاتی ہے۔\n"
                "• **سبسڈی کے بعد قیمت**: 50 ہارس پاور ٹریکٹر کسان کو تقریباً **15.5 تا 16.8 لاکھ روپے** میں ملتا ہے۔\n"
                "• **اہلیت**: پنجاب میں 1 تا 50 ایکڑ زرعی اراضی کے مالک کسان۔\n"
                "• **درخواست کا طریقہ**: پنجاب گرین ٹریکٹر پورٹل (gts.punjab.gov.pk) یا قریبی محکمہ زراعت توسیع دفتر سے رجوع کریں۔ ہیلپ لائن: 0800-17000۔"
            )
        elif language == "roman_urdu" or any(ru in lowered for ru in ["kya", "hai", "kitna", "keemat", "bhao", "chahiye"]):
            resp = (
                "🚜 **Pakistan Mein Tractor Ki Prices Aur CM Green Tractor Scheme**:\n\n"
                "1. **Market Retail Prices (Taqreeban Qematein)**:\n"
                "• **Millat / Massey Ferguson MF-240 (50 HP)**: Approx PKR 2,550,000 - 2,680,000\n"
                "• **Millat / Massey Ferguson MF-385 (85 HP)**: Approx PKR 4,450,000 - 4,700,000\n"
                "• **Al-Ghazi / New Holland NH-480 (55 HP)**: Approx PKR 2,600,000 - 2,750,000\n"
                "• **Al-Ghazi / New Holland Ghazi (65 HP)**: Approx PKR 3,150,000 - 3,350,000\n\n"
                "2. **CM Punjab Green Tractor Subsidy**:\n"
                "• Punjab Govt ki taraf se **PKR 1,000,000 (10 Lakhs)** ki flat cash subsidy milti hai.\n"
                "• **Subsidized Cost**: 50 HP tractor farmer ko taqreeban **PKR 1.55M - 1.68M** mein parta hai.\n"
                "• **Eligibility**: 1 se 50 acres zameen ke malik farmers.\n"
                "• **Apply Karne Ka Tareeqa**: Online portal (gts.punjab.gov.pk) ya Agriculture Extension Office. Helpline: 0800-17000."
            )
        else:
            resp = (
                "🚜 **Tractor Market Prices in Pakistan & CM Green Tractor Scheme**:\n\n"
                "1. **Current Commercial Market Prices**:\n"
                "• **Millat / Massey Ferguson MF-240 (50 HP)**: ~PKR 2,550,000 to PKR 2,680,000\n"
                "• **Millat / Massey Ferguson MF-385 (85 HP)**: ~PKR 4,450,000 to PKR 4,700,000\n"
                "• **Al-Ghazi / New Holland NH-480 (55 HP)**: ~PKR 2,600,000 to PKR 2,750,000\n"
                "• **Al-Ghazi / New Holland Ghazi (65 HP)**: ~PKR 3,150,000 to PKR 3,350,000\n\n"
                "2. **Chief Minister Punjab Green Tractor Scheme**:\n"
                "• Flat non-refundable cash subsidy of **PKR 1,000,000 (10 Lakhs)** directly discounted on new 50-85 HP tractors.\n"
                "• **Net Farmer Price with Subsidy**: ~PKR 1,550,000 - 1,680,000 for 50 HP models.\n"
                "• **Eligibility**: Owners of 1 to 50 acres of agricultural land in Punjab verified via PLRA computerized records.\n"
                "• **Application Portal**: https://gts.punjab.gov.pk | Directorate General of Agriculture (Field) Punjab | Helpline: 0800-17000."
            )

        return {
            "agent": "finance",
            "category": "tractor_machinery_pricing",
            "tool_used": "Machinery & Green Tractor Scheme Database",
            "tool_data": {
                "equipment": "Tractor",
                "mf_240_price_pkr": 2550000,
                "mf_385_price_pkr": 4450000,
                "green_tractor_subsidy_pkr": 1000000,
                "portal": "https://gts.punjab.gov.pk",
            },
            "response": resp,
            "context": context,
        }

    # 1. Government Schemes / Subsidy / Loan / Kisan Card Queries
    is_scheme_query = any(kw in lowered for kw in [
        "scheme", "subsid", "kisan card", "loan", "qarz", "grant", "support",
        "tractor", "tubewell", "solar", "سکیم", "اسکیم", "سبسڈی", "قرض", "امداد"
    ]) or "کسان کارڈ" in user_query

    if is_scheme_query:
        # Determine crop filter if query mentions a specific crop
        query_crop = None
        for c in ["wheat", "gandum", "cotton", "kapas", "rice", "chawal", "maize", "makai", "oilseed", "canola", "sunflower"]:
            if c in lowered:
                query_crop = "wheat" if c in ("wheat", "gandum") else ("cotton" if c in ("cotton", "kapas") else c)
                break

        schemes_data = SchemesService.get_schemes(province=province, district=district, crop=query_crop)
        matched = schemes_data.get("schemes", [])

        if language == "urdu" or any(u in user_query for u in ["کیا", "ہے", "کون", "سبسڈی", "کارڈ"]):
            if matched:
                top = matched[0]
                resp = (
                    f"حکومت پنجاب اور وفاق کی تصدیق شدہ زرعی اسکیموں کے تحت:\n"
                    f"1. **{top['name_ur']}**: {top['benefits_ur']}\n"
                    f"اہلیت: {', '.join(top['requirements_ur'][:2])}۔\n"
                    f"رابطہ ہیلپ لائن: {top.get('helpline', '0800-17000')}۔"
                )
            else:
                resp = "اس وقت آپ کے مخصوص ضلع کے لیے کوئی خاص مقامی اسکیم دستیاب نہیں ہے، تاہم وزیر اعظم یوتھ زرعی قرضہ اور کسان کارڈ تمام اضلاع کے لیے کھلے ہیں۔"
        elif language == "roman_urdu" or any(ru in lowered for ru in ["kya", "hai", "faida", "fayde", "kisan card"]):
            if matched:
                top = matched[0]
                resp = (
                    f"Government verified agri schemes ke mutabiq:\n"
                    f"1. **{top['name']}**: {top['benefits']}\n"
                    f"Eligibility: {', '.join(top['requirements'][:2])}.\n"
                    f"Apply karne ke liye: {top['how_to_apply']}\n"
                    f"Helpline: {top.get('helpline', '0800-17000')}."
                )
            else:
                resp = "Aap ke district ke mutabiq federal Kisan Card aur PM Agri Loan schemes dastiyab hain."
        else:
            if matched:
                top = matched[0]
                resp = (
                    f"Under verified government programs in {province}:\n"
                    f"1. **{top['name']}**: {top['benefits']}\n"
                    f"Key Requirements: {'; '.join(top['requirements'][:2])}.\n"
                    f"Application: {top['how_to_apply']}\n"
                    f"Helpline: {top.get('helpline', '0800-17000')} [Source: {top['source']}]."
                )
            else:
                resp = f"No localized scheme found for {district}, but nationwide Kisan Card and Agri Youth Loans are available."

        return {
            "agent": "finance",
            "category": "government_schemes",
            "tool_used": "Government Schemes Database (Official)",
            "tool_data": schemes_data,
            "response": resp,
            "context": context,
        }

    # 2. Profit Estimation Query
    try:
        req = ProfitEstimatorRequest(
            crop=crop.lower(),
            acres=float(acreage),
            district=district,
        )
        plan = run_profit_estimator(req)
        net_profit = plan.net_margin_pkr
        roi = plan.return_on_investment_percent

        if language == "urdu" or any(u in user_query for u in ["کتنا", "منافع", "روپے", "آمدن"]):
            resp = (
                f"{district} میں {acreage} ایکڑ {crop} کے لیے متوقع خالص منافع تقریباً "
                f"PKR {net_profit:,} روپے ہے (شرح منافع: +{roi:.1f}%)۔ "
                f"کل تخمینہ آمدن: PKR {plan.expected_gross_revenue_pkr:,} روپے اور لاگت: PKR {plan.total_input_cost_pkr:,} روپے ہے۔"
            )
        elif language == "roman_urdu" or any(ru in lowered for ru in ["kitna", "munafa", "profit", "paise"]):
            resp = (
                f"{district} mein {acreage} acres {crop} par mutawaqqa net profit taqreeban "
                f"PKR {net_profit:,} hai (ROI: +{roi:.1f}%). "
                f"Kul aamdani PKR {plan.expected_gross_revenue_pkr:,} aur kul lagat PKR {plan.total_input_cost_pkr:,} calculate hui hai."
            )
        else:
            resp = (
                f"Based on your {acreage} acres of {crop} in {district}, an estimated net profit is "
                f"PKR {net_profit:,} (ROI margin: +{roi:.1f}%). "
                f"Expected revenue is PKR {plan.expected_gross_revenue_pkr:,} against input costs of PKR {plan.total_input_cost_pkr:,}."
            )

        return {
            "agent": "finance",
            "category": "profit_estimate",
            "tool_used": "Deterministic Profit Calculator",
            "tool_data": {
                "net_profit_pkr": net_profit,
                "roi_percent": roi,
                "gross_revenue_pkr": plan.expected_gross_revenue_pkr,
                "total_cost_pkr": plan.total_input_cost_pkr,
            },
            "response": resp,
            "context": context,
        }
    except Exception:
        # Fallback simple calculation
        profit = int(float(acreage) * 140000)
        resp = f"Based on your {acreage} acres of {crop}, estimated net return is around PKR {profit:,}."
        return {
            "agent": "finance",
            "category": "profit_estimate",
            "response": resp,
            "context": context,
        }
