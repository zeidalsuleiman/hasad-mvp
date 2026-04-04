from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List, Dict, Any


class ChatRequest(BaseModel):
    """Request for AI assistant chat endpoint."""
    farm_id: UUID = Field(..., description="Farm ID to get context for")
    message: str = Field(..., min_length=1, max_length=1000, description="User's question or request")


class ChatResponse(BaseModel):
    """Response from AI assistant chat endpoint."""
    assistant_response: str = Field(..., description="The grounded AI response")
    sources_used: List[str] = Field(
        default_factory=list,
        description="List of data sources used (weather, irrigation, disease_risk)",
    )
    data_references: Dict[str, Any] = Field(
        default_factory=dict,
        description="Structured data referenced in the response",
    )
    tokens_used: int = Field(
        default=0,
        ge=0,
        description="LLM tokens used in generating the response",
    )
    confidence_level: str = Field(
        ...,
        description="Confidence level: high, medium, or low based on data availability",
    )

    class Config:
        from_attributes = True
