"""Government Support Finder Tool.
Surfaces the Kisan Card, subsidized fertilizer, and agri-loan schemes.
"""
from backend.app.models.schemas import GovtSchemeReport, GovtSchemeItem
from backend.app.data.datasets import GOVT_SUPPORT_SCHEMES


def run_govt_schemes(province: str = "Punjab", land_acres: float = 5.0) -> GovtSchemeReport:
    prov_clean = province.strip().lower()
    items = []

    for s in GOVT_SUPPORT_SCHEMES:
        p = s["province"].lower()
        if "all" in p or prov_clean in p or p in prov_clean:
            items.append(
                GovtSchemeItem(
                    title=s["title"],
                    province=s["province"],
                    eligibility=s["eligibility"],
                    benefit=s["benefit"],
                    how_to_apply=s["how_to_apply"],
                    urgency_note=s["urgency_note"],
                )
            )

    summary = (
        f"For a farmer cultivating {land_acres:.1f} acres in {province.title()}, "
        "you qualify for the CM Kisan Card interest-free input loan (up to PKR 150,000) "
        "and the subsidized agricultural solar tubewell scheme."
    )

    return GovtSchemeReport(
        province=province.title(),
        land_acres=land_acres,
        matched_schemes=items,
        recommendation_summary=summary,
    )
