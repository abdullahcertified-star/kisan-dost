import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, ForeignKey
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    province = Column(String(50), nullable=False)
    land_acres = Column(Float, nullable=False)
    soil_type = Column(String(100), nullable=False)
    water_availability = Column(String(100), nullable=False)
    current_crop = Column(String(100), nullable=False)
    preferred_language = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class FarmerSession(Base):
    __tablename__ = "farmer_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=True, default="Kisan Bhai")
    district = Column(String(100), default="Multan")
    tehsil = Column(String(100), nullable=True)
    land_acres = Column(Float, default=5.0)
    current_crop = Column(String(100), default="Wheat")
    soil_type = Column(String(100), default="Loam (Mera)")
    water_source = Column(String(100), default="Canal + Tubewell")
    preferred_language = Column(String(20), default="urdu")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("farmer_sessions.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'assistant', 'system'
    content = Column(Text, nullable=False)
    agent_name = Column(String(50), nullable=True)  # 'Triage', 'Agronomy', 'PestDoctor', etc.
    tool_data = Column(JSON, nullable=True)  # Structured Pydantic tool outputs
    created_at = Column(DateTime, default=utc_now)


class AdvisoryLog(Base):
    __tablename__ = "advisory_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("farmer_sessions.id"), nullable=True)
    advisory_type = Column(String(50), nullable=False)  # 'crop', 'fertilizer', 'pest', 'mandi', 'weather'
    input_data = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=utc_now)
