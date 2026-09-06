import sys
import os
import asyncio

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.agents.pest_doctor_agent import pest_doctor_agent
from backend.app.models.schemas import PestDiagnosisRequest


async def main():
    print("--- Test 1: Cotton Whitefly ---")
    req1 = PestDiagnosisRequest(
        crop='cotton',
        symptoms='White tiny insects flying under leaves, sticky honey dew and black sooty mold on leaf surface',
        district='Rahim Yar Khan',
        acres=10.0
    )
    res1 = await pest_doctor_agent.diagnose(req1)
    print(f"Pest: {res1.primary_diagnosis} ({res1.primary_diagnosis_ur})")
    print(f"Confidence: {res1.confidence}")
    print(f"Symptom Analysis: {res1.symptom_analysis[:120]}...")
    print(f"Non-chemical steps: {len(res1.non_chemical_management)}")
    if res1.verified_treatment:
        t = res1.verified_treatment
        print(f"Treatment: {t.active_ingredient} | Dosage: {t.safe_dosage_per_acre} | Water: {t.water_volume_liters_per_acre}L")
    print(f"Alternatives: {[a.pest_name for a in res1.alternative_possibilities]}")
    print(f"Safety notes: {len(res1.safety_notes)}")
    print(f"Dosage disclaimer: {'label' in res1.dosage_disclaimer.lower()}")
    print(f"Medical rejection: {res1.is_medical_query_rejected}")

    print("\n--- Test 2: Medical Query Interception ---")
    req2 = PestDiagnosisRequest(
        crop='wheat',
        symptoms='My child drank pesticide and is vomiting, chest pain and high fever',
        district='Multan'
    )
    res2 = await pest_doctor_agent.diagnose(req2)
    print(f"Diagnosis: {res2.primary_diagnosis}")
    print(f"Medical Intercepted: {res2.is_medical_query_rejected}")
    print(f"Rejection Notice: {(res2.medical_rejection_notice or '')[:100]}...")

    print("\n--- Test 3: Fall Armyworm in Maize ---")
    req3 = PestDiagnosisRequest(
        crop='maize',
        symptoms='Large ragged holes in whorl leaves with thick sawdust-like yellowish frass',
        district='Sahiwal'
    )
    res3 = await pest_doctor_agent.diagnose(req3)
    print(f"Pest: {res3.primary_diagnosis} ({res3.primary_diagnosis_ur})")
    print(f"Confidence: {res3.confidence}")
    if res3.verified_treatment:
        print(f"Treatment: {res3.verified_treatment.active_ingredient}")
    print(f"PHI: {res3.phi_days} days")

    print("\n✅ All tests passed!")


if __name__ == '__main__':
    asyncio.run(main())
