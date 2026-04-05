from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, SmallInteger
from sqlalchemy.orm import relationship

Base = declarative_base()

class Surah(Base):
    __tablename__ = "surahs"
    id = Column(SmallInteger, primary_key=True)
    name_arabic = Column(String(50), nullable=False)
    name_transliterated = Column(String(100), nullable=False)
    name_english = Column(String(100), nullable=False)
    revelation_type = Column(String(20), nullable=False)
    verse_count = Column(SmallInteger, nullable=False)
    juz_start = Column(SmallInteger, nullable=False)
    page_start = Column(SmallInteger, nullable=False)
    audio_url_base = Column(Text)
    
    verses = relationship("Verse", back_populates="surah")

class Verse(Base):
    __tablename__ = "verses"
    id = Column(Integer, primary_key=True, autoincrement=True)
    surah_id = Column(SmallInteger, ForeignKey("surahs.id", ondelete="CASCADE"), nullable=False)
    verse_number = Column(SmallInteger, nullable=False)
    verse_key = Column(String(10), nullable=False, unique=True)
    text_uthmani = Column(Text, nullable=False)
    text_imlaei = Column(Text, nullable=False)
    text_simple = Column(Text, nullable=False)
    juz_number = Column(SmallInteger, nullable=False)
    page_number = Column(SmallInteger, nullable=False)
    
    surah = relationship("Surah", back_populates="verses")
    words = relationship("Word", back_populates="verse")

class Word(Base):
    __tablename__ = "words"
    id = Column(Integer, primary_key=True, autoincrement=True)
    verse_id = Column(Integer, ForeignKey("verses.id", ondelete="CASCADE"), nullable=False)
    surah_id = Column(SmallInteger, nullable=False)
    verse_number = Column(SmallInteger, nullable=False)
    position = Column(SmallInteger, nullable=False)
    text_uthmani = Column(String(200), nullable=False)
    text_transliteration = Column(String(200))
    audio_url = Column(Text)
    
    verse = relationship("Verse", back_populates="words")
