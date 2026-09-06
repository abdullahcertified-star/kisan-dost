import pytest
from backend.app.guardrails.input_guardrails import InputGuardrail
from backend.app.guardrails.safety_guardrails import SafetyGuardrail


def test_input_guardrail_allows_agri_query():
    is_valid, msg = InputGuardrail.validate_input("Gandum k liye urea kitni bori dalain?")
    assert is_valid is True
    assert msg is None


def test_input_guardrail_blocks_human_medical():
    is_valid, msg = InputGuardrail.validate_input("My child has high fever and cough, what medicine to give?")
    assert is_valid is False
    assert "Medical Notice" in msg
    assert "doctor" in msg.lower()


def test_input_guardrail_blocks_off_topic_crypto():
    is_valid, msg = InputGuardrail.validate_input("How do I invest in bitcoin and crypto gambling?")
    assert is_valid is False
    assert "Off-Topic" in msg


def test_safety_guardrail_allows_safe_dosage():
    is_safe, dosage, warning = SafetyGuardrail.validate_pesticide_dosage("whitefly", 250.0)
    assert is_safe is True
    assert dosage == 250.0


def test_safety_guardrail_blocks_overdose():
    # Attempt lethal overdose of 800ml when max is 300ml
    is_safe, dosage, warning = SafetyGuardrail.validate_pesticide_dosage("whitefly", 800.0)
    assert is_safe is False
    assert dosage <= 300.0
    assert "DANGER OVERDOSE BLOCKED" in warning
