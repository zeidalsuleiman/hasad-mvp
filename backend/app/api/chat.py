from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.schemas.chat import (
    SessionCreate,
    SessionOut,
    SessionUpdate,
    SessionWithMessages,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.chat_service import ChatService

router = APIRouter()


@router.post("/sessions", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    body: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.create_session(
        db,
        user_id=str(current_user.id),
        farm_id=str(body.farm_id) if body.farm_id else None,
        title=body.title,
    )


@router.get("/sessions", response_model=List[SessionOut])
def list_sessions(
    farm_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.list_sessions(db, str(current_user.id), farm_id=farm_id)


@router.patch("/sessions/{session_id}", response_model=SessionOut)
def update_session(
    session_id: str,
    body: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.update_session(db, session_id, str(current_user.id), body.title)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ChatService.delete_session(db, session_id, str(current_user.id))


@router.get("/sessions/{session_id}", response_model=SessionWithMessages)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ChatService.get_session(db, session_id, str(current_user.id))


@router.post("/sessions/{session_id}/messages", response_model=SendMessageResponse)
def send_message(
    session_id: str,
    body: SendMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_msg, assistant_msg, sources, confidence = ChatService.send_message(
        db=db,
        session_id=session_id,
        user_id=str(current_user.id),
        farm_id=str(body.farm_id),
        message=body.message,
    )
    return SendMessageResponse(
        user_message=user_msg,
        assistant_message=assistant_msg,
        sources_used=sources,
        confidence_level=confidence,
    )
