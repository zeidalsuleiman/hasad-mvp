from datetime import datetime
from uuid import UUID
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class SessionCreate(BaseModel):
    farm_id: Optional[UUID] = None
    title: Optional[str] = None


class MessageOut(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    citations_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionOut(BaseModel):
    id: UUID
    farm_id: Optional[UUID] = None
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionWithMessages(SessionOut):
    messages: List[MessageOut] = []


class SessionUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    farm_id: UUID


class SendMessageResponse(BaseModel):
    user_message: MessageOut
    assistant_message: MessageOut
    sources_used: List[str] = []
    confidence_level: str = "low"
