"""Character Model"""
from sqlalchemy import Column, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Character(Base):
    __tablename__ = "characters"

    id = Column(String(36), primary_key=True)
    novel_id = Column(String(36), ForeignKey("novels.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    personality_tags = Column(JSON)
    aliases = Column(JSON)  # 别名列表
    first_appearance_chapter = Column(Integer)
    appearance_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
