"""Chapter Model"""
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.core.database import Base


class Chapter(Base):
    __tablename__ = "chapters"

    id = Column(String(36), primary_key=True)
    novel_id = Column(String(36), ForeignKey("novels.id"), nullable=False, index=True)
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(500))
    content = Column(Text)
    summary = Column(Text)
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
