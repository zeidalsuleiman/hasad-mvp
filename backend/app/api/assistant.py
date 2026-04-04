from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.assistant import ChatRequest, ChatResponse
from app.models.user import User
from app.services.assistant_service import AssistantService
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get AI-powered agricultural advice for a farm.

    Uses farm context (crop, weather, irrigation, disease risk) to provide
    grounded responses. Phase 3 MVP is stateless - no session persistence.
    """
    # Validate farm ownership
    from app.services.farm_service import FarmService
    import uuid
    farm = FarmService.get_farm_by_id(db, str(request.farm_id))
    FarmService.check_ownership(farm, str(current_user.id))

    # Process the chat request
    # This builds context, determines sources, and returns a response
    # Returns: (response_text, sources_list, data_dict, confidence_str, tokens_used)
    response_text, sources_list, data_dict, confidence_str, tokens_used = AssistantService.process_chat_request(
        db=db,
        farm_id=str(request.farm_id),
        user_question=request.message,
    )

    return ChatResponse(
        assistant_response=response_text,
        sources_used=sources_list,
        data_references=data_dict,
        tokens_used=tokens_used,
        confidence_level=confidence_str,
    )
