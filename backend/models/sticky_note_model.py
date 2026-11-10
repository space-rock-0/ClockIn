from pydantic import BaseModel
from typing import Optional
from enum import Enum

class StickyNoteColor(str, Enum):
    red = "red"
    orange = "orange"
    yellow = "yellow"
    green = "green"
    blue = "blue"
    purple = "purple"
    pink = "pink"



class Position(BaseModel):
    x: int
    y: int
    z: int


class StickyNoteCreate(BaseModel):
    title: str
    content: str
    color: StickyNoteColor
    position: Position


class StickyNoteSave(BaseModel):
    id: Optional[str] = None
    title: str
    content: str
    color: str
    position: Position

class StickyNoteColorUpdate(BaseModel):
    color: StickyNoteColor


class StickyNotePositionUpdate(BaseModel):
    x: int
    y: int
    z: int